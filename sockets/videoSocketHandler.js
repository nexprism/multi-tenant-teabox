import progressQueue from '../queue/videoProgressQueue.js';

const videoSocketHandler = (socket) => {
  socket.on('video-progress', async (data) => {
    const { videoId, userId, currentTime, duration } = data;

    if (!videoId || !userId || currentTime === undefined) {
      return socket.emit('error', { message: 'Invalid progress data' });
    }

    try {
      await progressQueue.add(
        { videoId, userId, currentTime, duration },
        {
          jobId: `${videoId}-${userId}`,
          removeOnComplete: true,
          delay: 30000,
        }
      );

      socket.emit('progress-queued', { success: true });
    } catch (err) {
      console.error('Socket queue error:', err);
      socket.emit('error', { message: 'Failed to queue progress' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
};

export default videoSocketHandler;
