document.addEventListener("DOMContentLoaded", () => {
    // Cek apakah data BMI sudah ada di localStorage
    const storedBMIData = localStorage.getItem("bmiData");
    if (storedBMIData) {
        const data = JSON.parse(storedBMIData);
        console.log("Using cached BMI data:", data);
        window.location.href = "./recipes.html";
        return;
    }

    const form = document.querySelector("form");
    const heightInput = document.getElementById("height");
    const weightInput = document.getElementById("weight");

    const loadingOverlay = document.getElementById("loading-overlay");
    const loadingDots = document.getElementById("loading-dots");
    const submitButton = form.querySelector('button[type="submit"]');

    let dotsInterval;

    function startLoading() {
        loadingOverlay.classList.remove("hidden");
        submitButton.disabled = true;
        submitButton.innerHTML = `
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...`;

        dotsInterval = setInterval(() => {
            const currentDots = loadingDots.innerText;
            if (currentDots.length >= 3) {
                loadingDots.innerText = ".";
            } else {
                loadingDots.innerText += ".";
            }
        }, 400);
    }

    function stopLoading() {
        clearInterval(dotsInterval);
        loadingDots.innerText = ".";
        loadingOverlay.classList.add("hidden");
        submitButton.disabled = false;
        submitButton.textContent = "Next";
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const height = heightInput.value;
        const weight = weightInput.value;

        if (!height || !weight) {
            alert("Tolong isi tinggi dan berat badan.");
            return;
        }

        startLoading();

        try {
            if (localStorage.getItem("bmiData")) {
                localStorage.removeItem("bmiData");
            }

            const response = await fetch(
                "https://calorie-craft-backend-production.up.railway.app/api/bmi/calculate",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ height, weight }),
                }
            );

            if (!response.ok) {
                throw new Error("Gagal mendapatkan data dari server");
            }

            const data = await response.json();
            localStorage.setItem("bmiData", JSON.stringify(data));

            window.location.href = "./recipes.html";
        } catch (err) {
            console.error("Terjadi kesalahan:", err);
            alert(
                "Terjadi kesalahan saat mengambil data. Pastikan server sedang berjalan."
            );
            stopLoading();
        }
    });
});
