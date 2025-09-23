import axios from "axios";
import { api_url } from "../../../config";

const API = axios.create({
  baseURL:api_url, // adjust if your backend runs elsewhere
});

// Create billing with details
export const createBilling = async (billingData) => {
  return await API.post("products/createBilling", billingData);
};
