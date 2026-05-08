const svc=require('./notifications.service');
const asyncHandler=require('../../utils/asyncHandler');
const { success,noContent,paginated }=require('../../utils/response');
const list       =asyncHandler(async(req,res)=>{ const r=await svc.list(req.tenantId,req.user.id,req.query); paginated(res,r.data,r.meta); });
const markRead   =asyncHandler(async(req,res)=>{ await svc.markRead(req.tenantId,req.user.id,req.params.id); noContent(res); });
const markAllRead=asyncHandler(async(req,res)=>{ await svc.markAllRead(req.tenantId,req.user.id); noContent(res); });
const unreadCount=asyncHandler(async(req,res)=>success(res,await svc.unreadCount(req.tenantId,req.user.id)));
module.exports={ list,markRead,markAllRead,unreadCount };
