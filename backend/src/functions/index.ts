import * as authFunctions from "./auth";
import * as commissionFunctions from "./commissions";
import * as calculatorFunctions from "./calculator";
import * as activityFunctions from "./activity";
import * as middleware from "@/middleware/auth";

export const login = authFunctions.login;
export const verifyAdmin = authFunctions.verifyAdmin;

export const calculateCommission = commissionFunctions.calculateCommission;
export const onCommissionCreated = commissionFunctions.onCommissionCreated;
export const onCommissionStatusChanged = commissionFunctions.onCommissionStatusChanged;

export const calculateExportCost = calculatorFunctions.calculateExportCost;

export const addActivityLog = activityFunctions.addActivityLog;
export const adminAuth = middleware.adminAuth;
