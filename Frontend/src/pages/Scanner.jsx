import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

const Scanner = () => {
    const navigate = useNavigate();
    const scannerRef = useRef(null);
    const isRunningRef = useRef(false);
    const hasStoppedRef = useRef(false);

    useEffect(() => {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 250 },
            (decodedText) => {
                try {
                    const data = JSON.parse(decodedText);

                    console.log("QR DATA:", data);

                    if (isRunningRef.current && !hasStoppedRef.current) {
                        hasStoppedRef.current = true;
                        isRunningRef.current = false;

                        scanner.stop()
                            .then(() => scanner.clear())
                            .catch(() => { })
                            .finally(() => {
                                navigate("/sending", { state: data });
                            });
                    }

                } catch (err) {
                    console.error("QR parse error:", err);
                }
            }
        ).then(() => {
            isRunningRef.current = true;
        }).catch(err => {
            console.error("Camera start error:", err);
        });

        return () => {
            if (
                scannerRef.current &&
                isRunningRef.current &&
                !hasStoppedRef.current
            ) {
                hasStoppedRef.current = true;

                scannerRef.current.stop()
                    .then(() => scannerRef.current.clear())
                    .catch(() => { });
            }
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
            <h2 className="mb-4 text-lg">امسح رمز QR</h2>
            <div id="reader" style={{ width: "300px" }}></div>
        </div>
    );
};

export default Scanner;