
import { NextResponse } from "next/server";
import SettingService from "../services/SettingService.js";
import SettingRepository from "../repository/SettingRepository.js";
import { getSubdomain } from "../tenantDb.js";

class SettingController {
	constructor(settingService) {
		this.settingService = settingService;
	}

	async getSetting(request, _res, _conn, tenant) {
		try {
			const tenantToUse = tenant || getSubdomain(request) || "default";
			const setting = await this.settingService.getSetting(tenantToUse, _conn);
			if (!setting) {
				return NextResponse.json({ error: "Setting not found" }, { status: 404 });
			}

			// Normalize: if admin saved branding object, expose top-level `logo` and `websiteColor`
			try {
				const s = setting?.toObject ? setting.toObject() : { ...setting };
				if (s) {
					if (!s.logo && s.branding && s.branding.logoUrl) {
						s.logo = s.branding.logoUrl;
					}
					if (!s.websiteColor && s.branding && s.branding.logoColors) {
						// prefer accent, then primary
						s.websiteColor = s.branding.logoColors.accent || s.branding.logoColors.primary || s.websiteColor;
					}
				}
				return NextResponse.json({ success: true, setting: s });
			} catch (e) {
				return NextResponse.json({ success: true, setting });
			}
		} catch (err) {
			return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
		}
	}

	async updateSetting(request, _res, body, _conn, tenant) {
		try {
			const tenantToUse = tenant || getSubdomain(request) || "default";

			console.log('[SettingController] updateSetting called for tenant=', tenantToUse, 'conn=', _conn && (_conn.name || _conn.host) ? (_conn.name || _conn.host) : (_conn ? 'connection' : 'no-conn'));

			// Accept plain JSON body with fields like `logo` (string path/URL) and `websiteColor` (hex)
			const incoming = body || (await request.json());

			// Normalize incoming payload so both `branding` and top-level fields stay in sync
			const updatedData = { ...incoming };

			// If admin sends `branding` object, derive top-level fields
			if (incoming.branding) {
				try {
					if (incoming.branding.logoUrl && !updatedData.logo) {
						updatedData.logo = incoming.branding.logoUrl;
					}
					const logoColors = incoming.branding.logoColors || {};
					if ((logoColors.accent || logoColors.primary) && !updatedData.websiteColor) {
						updatedData.websiteColor = logoColors.accent || logoColors.primary;
					}
				} catch (e) {
					// ignore
				}
			}

			// If top-level fields provided, mirror them into branding for consistency
			if (updatedData.logo) {
				updatedData.branding = updatedData.branding || {};
				updatedData.branding.logoUrl = updatedData.logo;
			}
			if (updatedData.websiteColor) {
				updatedData.branding = updatedData.branding || {};
				updatedData.branding.logoColors = updatedData.branding.logoColors || {};
				// store as 'accent'
				updatedData.branding.logoColors.accent = updatedData.websiteColor;
			}

			const updated = await this.settingService.updateSetting(tenantToUse, updatedData, _conn);
			console.log('[SettingController] update result id=', updated?._id || updated?.id, 'tenant=', tenantToUse);

			// Ensure response contains normalized top-level fields
			try {
				const s = updated?.toObject ? updated.toObject() : { ...updated };
				if (s) {
					if (!s.logo && s.branding && s.branding.logoUrl) s.logo = s.branding.logoUrl;
					if (!s.websiteColor && s.branding && s.branding.logoColors)
						s.websiteColor = s.branding.logoColors.accent || s.branding.logoColors.primary || s.websiteColor;
				}
				return NextResponse.json({ success: true, setting: s });
			} catch (e) {
				return NextResponse.json({ success: true, setting: updated });
			}
		} catch (err) {
			return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
		}
	}
}

const settingService = new SettingService(new SettingRepository());
const settingController = new SettingController(settingService);

export default settingController;

