import { getSubdomain, getDbConnection } from '../../../lib/tenantDb.js';
import { NextResponse } from 'next/server';
import cartController from '../../../lib/controllers/cartContoller.js';
import { withUserAuth } from '../../../middleware/commonAuth.js';
import mongoose from 'mongoose';
import WhatsappService from '../../../lib/services/WhatsappService.js';
import axios from 'axios';

// Advanced validation helpers
function validateCartItem(item) {
    if (!item || typeof item !== 'object') return 'Invalid item payload';
    if (!item.product) return 'Product is required';
    if (item.quantity == null || isNaN(item.quantity) || item.quantity < 1) return 'Quantity must be at least 1';
    if (item.price == null || isNaN(item.price) || item.price < 0) return 'Price must be a non-negative number';
    return null;
}


export async function GET(request) {
    try {
        // 🔹 Connect tenant DB (optional if needed)
        const subdomain = getSubdomain(request);
        const conn = await getDbConnection(subdomain);

        if (!conn) {
            return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
        }

        // 🔹 Initialize WhatsApp Service
        const whatsappService = new WhatsappService();

        // 🔹 Send template message (no params for hello_world)
        const response = await whatsappService.sendTemplateMessage(
            '918347496266',
            'hello_world', [],
        );

        //console.log('✅ WhatsApp test response:', response.data);

        return NextResponse.json({
            success: true,
            message: 'WhatsApp Hello World message sent successfully!',
            data: response.data
        });
    } catch (err) {
        //console.error('❌ WhatsApp test error:', err.response ? .data || err.message);
        return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
    } finally {
        // 🔹 Close mongoose connection (if opened per request)
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
}


// export async function GET(request) {
//     try {
//         // 🏷 Get tenant/subdomain connection
//         const subdomain = getSubdomain(request);
//         const conn = await getDbConnection(subdomain);
//         if (!conn) {
//             return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
//         }


//         const Cart = conn.models.Cart || conn.model('Cart', cartSchema);

//         // 🕐 Get carts not updated in last 24 hours (active ones only)
//         const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago
//         const abandonedCarts = await Cart.find({
//             updatedAt: { $lte: cutoff },
//             status: 'active',
//             items: { $exists: true, $ne: [] },
//         }).populate('user');

//         //console.log(`🛒 Found ${abandonedCarts.length} abandoned carts for ${subdomain}`);

//         // 🔁 Update each cart and send event
//         for (const cart of abandonedCarts) {
//             cart.status = 'abandoned';
//             await cart.save();

//             // 🚀 Trigger WhatsApp cart_abandoned event
//             try {
//                 await axios.post(`${process.env.BASE_URL}/api/whatsapp/event`, {
//                     event: 'cart_abandoned',
//                     userId: cart.user ? ._id || null,
//                     cartId: cart._id,
//                 });
//                 //console.log(`✅ WhatsApp event sent for cart ${cart._id}`);
//             } catch (err) {
//                 //console.error(`❌ Failed to send WhatsApp event for cart ${cart._id}:`, err.message);
//             }
//         }

//         return NextResponse.json({
//             success: true,
//             message: `Processed ${abandonedCarts.length} abandoned carts.`,
//         });
//     } catch (err) {
//         //console.error('🚨 GET /cart-abandoned error:', err);
//         return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
//     } finally {
//         // Optional: close connection if your setup opens per request
//         if (mongoose.connection.readyState === 1) {
//             await mongoose.disconnect();
//         }
//     }
// }