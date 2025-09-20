import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // adjust if your backend runs elsewhere
});

// Create billing with details
export const createBilling = async (billingData) => {
  return await API.post("/products/createBilling", billingData);
};
