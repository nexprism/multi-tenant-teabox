import { NextResponse } from 'next/server';
import { redisWrapper } from '../../../config/redis.js';

// GET - Get Redis status
export async function GET() {
  try {
    const status = redisWrapper.getStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Redis status retrieved',
      data: {
        ...status,
        environment: {
          REDIS_ENABLED: process.env.REDIS_ENABLED || 'not set',
          REDIS_HOST: process.env.REDIS_HOST || 'not set',
          REDIS_PORT: process.env.REDIS_PORT || 'not set',
          REDIS_PASSWORD: process.env.REDIS_PASSWORD ? '***set***' : 'not set'
        }
      }
    });
  } catch (error) {
    //console.error('Error getting Redis status:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get Redis status',
      error: error.message
    }, { status: 500 });
  }
}

// POST - Enable/disable Redis
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, enabled } = body;

    if (action === 'toggle' || enabled !== undefined) {
      const targetState = enabled !== undefined ? enabled : !redisWrapper.isEnabled();
      
      if (targetState) {
        await redisWrapper.enable();
      } else {
        await redisWrapper.disable();
      }

      const status = redisWrapper.getStatus();
      
      return NextResponse.json({
        success: true,
        message: `Redis ${targetState ? 'enabled' : 'disabled'} successfully`,
        data: status
      });
    }

    if (action === 'test') {
      try {
        const client = await redisWrapper.getClient();
        const testKey = `test:${Date.now()}`;
        const testValue = 'Redis test value';
        
        await client.set(testKey, testValue);
        const retrievedValue = await client.get(testKey);
        await client.del(testKey);
        
        const isWorking = retrievedValue === testValue;
        
        return NextResponse.json({
          success: true,
          message: 'Redis test completed',
          data: {
            testPassed: isWorking,
            enabled: redisWrapper.isEnabled(),
            testDetails: {
              stored: testValue,
              retrieved: retrievedValue,
              matches: isWorking
            }
          }
        });
      } catch (testError) {
        return NextResponse.json({
          success: false,
          message: 'Redis test failed',
          error: testError.message,
          data: { enabled: redisWrapper.isEnabled() }
        }, { status: 500 });
      }
    }

    if (action === 'clear') {
      try {
        const client = await redisWrapper.getClient();
        await client.flushall();
        
        return NextResponse.json({
          success: true,
          message: 'Redis cache cleared successfully',
          data: redisWrapper.getStatus()
        });
      } catch (clearError) {
        return NextResponse.json({
          success: false,
          message: 'Failed to clear Redis cache',
          error: clearError.message
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action. Use "toggle", "test", "clear", or set "enabled" boolean'
    }, { status: 400 });

  } catch (error) {
    //console.error('Error managing Redis:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to manage Redis',
      error: error.message
    }, { status: 500 });
  }
}

// PUT - Update Redis configuration (advanced)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reconnect') {
      // Disconnect and reconnect
      await redisWrapper.disconnect();
      await redisWrapper.enable();
      
      return NextResponse.json({
        success: true,
        message: 'Redis reconnected successfully',
        data: redisWrapper.getStatus()
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action. Use "reconnect"'
    }, { status: 400 });

  } catch (error) {
    //console.error('Error updating Redis configuration:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update Redis configuration',
      error: error.message
    }, { status: 500 });
  }
}
