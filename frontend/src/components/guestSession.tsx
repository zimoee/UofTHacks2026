"use client";
import { useEffect } from "react";
import api from "@/lib/api";

export default function GuestSessionInit() {
  useEffect(() => {
    const CreateGuestSession = async () => {
      if (localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')) return;
      try {
        const res = await api.get("/api/guest-session");
        const data = res.data;
        localStorage.setItem('accessToken',data.access);
        localStorage.setItem('refreshToken', data.refresh);
      } catch (err) {
          console.log("Error creating guest session.", err);
      }
    };
    CreateGuestSession();
  }, []);
  return null;
}