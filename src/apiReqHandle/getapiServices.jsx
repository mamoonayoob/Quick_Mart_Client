import axios from "axios";

const api = axios.create({
  baseURL: "https://nextgenretail.site/quickmart/api/",
});
// ---------------------------------keep token in header---------------------------------------
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      console.log("token exist so then this requestion is private");

      config.headers.Authorization = `Bearer ${token}`; // token attach
    } else {
      console.log("token does not exist");
    }
    return config;
  } catch (error) {
    return Promise.reject(error);
  }
});
// ----------------------------Genral public Get all product request---------------------------------
export const genralGetReq = (url) => {
  return api
    .get(url)
    .then((res) => res.data)
    .catch((err) => {
      console.log("error in genralGetReq function", err.message);
    });
};

// ----------------------------Genral private Post Request---------------------------------
export const postReq = (url, data = {}) => {
  return api
    .post(url, data)
    .then((res) => res.data)
    .catch((err) => {
      console.log("error ocured in post method", err.message);
      throw err;
    });
};

// ----------------------------Genral private Delete Request---------------------------------

export const delReq = (url) => {
  return api
    .delete(url)
    .then((res) => res.data)
    .catch((err) => {
      console.log("error occured in Del Req", err.message);
      throw err;
    });
};
// ----------------------------Genral private Put/patch Request---------------------------------
export const patchReq = (url, updatedData) => {
  return api
    .patch(url, updatedData)
    .then((res) => res.data)
    .catch((err) => {
      console.log("error occured in patch product", err.message);
      throw err;
    });
};

// ----------------------------Genral private patch Request---------------------------------
export const putReq = (url, updatedData) => {
  return api
    .put(url, updatedData)
    .then((res) => res.data)
    .catch((err) => {
      console.log("error occured in putReq", err.message);
      throw err;
    });
};
export default api;
