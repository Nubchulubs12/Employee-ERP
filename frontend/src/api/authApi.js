const BASE_URL = "http://localhost:8080/api/auth";

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