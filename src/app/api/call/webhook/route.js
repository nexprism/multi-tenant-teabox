import { webhookController } from '../../../lib/controllers/callController';

export async function POST(request) {
  // thin wrapper: delegate to controller
  return await webhookController(request);
}
