import { NextResponse } from 'next/server';
import OrderController from '../../../../lib/controllers/orderController.js';
import OrderService from '../../../../lib/services/orderService.js';
import OrderRepository from '../../../../lib/repository/OrderRepository.js';
import CouponService from '../../../../lib/services/CouponService.js';
import CouponRepository from '../../../../lib/repository/CouponRepository.js';
import { OrderSchema } from '../../../../lib/models/Order.js';
import { CouponSchema } from '../../../../lib/models/Coupon.js';
import { getSubdomain, getDbConnection } from '../../../../lib/tenantDb';
import { withUserAuth } from '../../../../middleware/commonAuth.js';

export const PUT = withUserAuth(async function (request, { params }) {
    try {
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);
        if (!conn) {
            return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
        }

        const Order = conn.models.Order || conn.model('Order', OrderSchema);
        const Coupon = conn.models.Coupon || conn.model('Coupon', CouponSchema);

        const orderRepo = new OrderRepository(Order, conn);
        const couponRepo = new CouponRepository(Coupon);
        const couponService = new CouponService(couponRepo);
        const orderService = new OrderService(orderRepo, couponService);
        const orderController = new OrderController(orderService);

        const result = await orderController.cancelOrder(request, conn, params);

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        // After cancelling the order in DB, attempt to cancel shipment with courier account if available
        try {
            const { id: orderId } = await params;
            // fetch fresh order data
            const orderResp = await orderService.getOrderById(orderId, null, ["items.product"]);
            if (orderResp && orderResp.success && orderResp.data && orderResp.data.shipping_details) {
                const shipping = orderResp.data.shipping_details || {};
                // Prefer explicit order.shippingMethod when available, then shipping.platform, then carrier
                const courier = (orderResp.data.shippingMethod || shipping.platform || shipping.carrier || "").toString();
                if (courier) {
                    // build cancel body: prefer waybill/awb/reference present on order
                    const cancelBody = {};
                    // include the shippingMethod from order so courier handlers can use exact method
                    if (orderResp.data.shippingMethod) cancelBody.shippingMethod = orderResp.data.shippingMethod;
                    if (shipping.waybill) cancelBody.waybill = shipping.waybill;
                    if (shipping.reference_number) cancelBody.AWBNo = shipping.reference_number;
                    if (shipping.awb_number) cancelBody.AWBNo = shipping.awb_number;

                    // try to fetch tenant settings to supply courier credentials (if stored there)
                    const Setting = conn.models.Setting || conn.model('Setting', require('../../../../lib/models/Setting.js').SettingSchema);
                    const settings = await Setting.findOne({ tenant: subdomain }).lean().catch(() => null);
                    // merge known credentials from settings into cancelBody if present
                    if (settings) {
                        if (settings.dtdcApiKey || settings.DTDC_API_KEY) cancelBody['api-key'] = settings.dtdcApiKey || settings.DTDC_API_KEY;
                        if (settings.DTDC_CUSTOMER_CODE) cancelBody.customerCode = settings.DTDC_CUSTOMER_CODE;
                        if (settings.DELHIVERY_API_TOKEN) cancelBody.token = settings.DELHIVERY_API_TOKEN;
                        if (settings.bluedartClientId) cancelBody.clientId = settings.bluedartClientId;
                        if (settings.bluedartClientSecret) cancelBody.clientSecret = settings.bluedartClientSecret;
                    }

                    // call cancelShipment on service (it will use env vars as fallback)
                    const cancelResp = await orderService.cancelShipment(orderResp.data, courier, cancelBody, conn);
                    // attach courier cancel response to main response
                    result.courierCancel = cancelResp;
                }
            }
        } catch (err) {
            // non-fatal: include error info
            result.courierCancel = { success: false, message: err.message };
        }

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
});
