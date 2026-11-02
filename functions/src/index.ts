
import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

setGlobalOptions({
  maxInstances: 10,
  region: "asia-southeast1",
});

initializeApp();

const adminAuth = getAuth();
const db = getFirestore();

const ALLOWED_ROLES = [
  "admin",
  "assistant_treasurer",
  "prefect",
] as const;

type UserRole = (typeof ALLOWED_ROLES)[number];

async function verifyStaff(
  uid: string | undefined
): Promise<string> {
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "Please sign in first."
    );
  }

  const staffDoc = await db.collection("users").doc(uid).get();

  if (!staffDoc.exists) {
    throw new HttpsError(
      "permission-denied",
      "Your account is not authorized."
    );
  }

  const role = staffDoc.data()?.role;

  if (
    role !== "admin" &&
    role !== "assistant_treasurer"
  ) {
    throw new HttpsError(
      "permission-denied",
      "Only authorized staff can manage accounts."
    );
  }

  return uid;
}

function validateRole(role: unknown): role is UserRole {
  return (
    typeof role === "string" &&
    ALLOWED_ROLES.includes(role as UserRole)
  );
}

// CREATE USER ACCOUNT

export const createUserAccount = onCall(
  async (request) => {
    const staffUid = await verifyStaff(
      request.auth?.uid
    );

    const { email, password, role } = request.data ?? {};

    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid email is required."
      );
    }

    if (
      typeof password !== "string" ||
      password.length < 8
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Password must contain at least 8 characters."
      );
    }

    if (!validateRole(role)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid user role."
      );
    }

    let newUser;

    try {
      newUser = await adminAuth.createUser({
        email: email.trim(),
        password,
        disabled: false,
      });
    } catch (error) {
      console.error("Account creation failed:", error);

      throw new HttpsError(
        "already-exists",
        "Unable to create account. The email may already be registered."
      );
    }

    try {
      await db.collection("users").doc(newUser.uid).set({
        email: newUser.email ?? email.trim(),
        role,
        disabled: false,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: staffUid,
      });
    } catch (error) {
      await adminAuth.deleteUser(newUser.uid);

      console.error("User record creation failed:", error);

      throw new HttpsError(
        "internal",
        "Unable to save user record."
      );
    }

    return {
      success: true,
      uid: newUser.uid,
      message: "User account created successfully.",
    };
  }
);

// DEACTIVATE USER ACCOUNT

export const deactivateUserAccount = onCall(
  async (request) => {
    const staffUid = await verifyStaff(
      request.auth?.uid
    );

    const targetUid = request.data?.uid;

    if (
      typeof targetUid !== "string" ||
      !targetUid.trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid user ID is required."
      );
    }

    if (targetUid === staffUid) {
      throw new HttpsError(
        "failed-precondition",
        "You cannot deactivate your own account."
      );
    }

    const targetRef = db.collection("users").doc(targetUid);
    const targetDoc = await targetRef.get();

    if (!targetDoc.exists) {
      throw new HttpsError(
        "not-found",
        "User account was not found."
      );
    }

    if (targetDoc.data()?.role === "admin") {
      throw new HttpsError(
        "permission-denied",
        "Admin accounts cannot be deactivated."
      );
    }

    try {
      await adminAuth.updateUser(targetUid, {
        disabled: true,
      });

      await targetRef.update({
        disabled: true,
        deactivatedAt: FieldValue.serverTimestamp(),
        deactivatedBy: staffUid,
      });
    } catch (error) {
      console.error("Account deactivation failed:", error);

      throw new HttpsError(
        "internal",
        "Unable to deactivate this account."
      );
    }

    return {
      success: true,
      message: "User account deactivated successfully.",
    };
  }
);
