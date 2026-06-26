//const BASE_URL = "https://employee-erps.onrender.com/api/auth";
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;
export async function loginUser(credentials) {
const response = await fetch(`${BASE_URL}/login`,{
    method: 'POST',
    headers: {
    'Content-Type' : 'application/json',
    },
    body: JSON.stringify(credentials),
    });
    const text = await response.text();
    let data;
    try {
    data= text ? JSON.parse(text) : null;
    }catch {
    data =text;
    }
    if(!response.ok) {
    throw new Error(data || "login failed");
    }
    return data;
}

async function postAuth(path, payload, fallbackMessage) {
const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
    'Content-Type' : 'application/json',
    },
    body: JSON.stringify(payload),
    });
    const text = await response.text();
    let data;
    try {
    data= text ? JSON.parse(text) : null;
    }catch {
    data =text;
    }
    if(!response.ok) {
    throw new Error(data || fallbackMessage);
    }
    return data;
}

export async function requestPasswordResetCode(payload) {
    return postAuth(
        "/forgot-password/request-code",
        payload,
        "Unable to send reset code."
    );
}

export async function verifyPasswordResetCode(payload) {
    return postAuth(
        "/forgot-password/verify-code",
        payload,
        "Invalid or expired reset code."
    );
}

export async function resetPassword(payload) {
    return postAuth(
        "/forgot-password/reset",
        payload,
        "Unable to reset password."
    );
}
