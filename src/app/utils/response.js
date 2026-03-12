export const successResponse = (data, message = 'Success', status = 200) => {
  return {
    status,
    body: { success: true, message, data },
  };
};

export const errorResponse = (message = 'Error', status = 500, errors = {}) => {
  return {
    status,
    body: { success: false, message, errors },
  };
};