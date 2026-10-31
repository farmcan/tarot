import {recordFamilyReferral} from '../../shared/family-referrals.mjs';
export const onRequest=context=>recordFamilyReferral(context.request,context.env.MIAOTAROT_DB,'miaotarot');
