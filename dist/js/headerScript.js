document.addEventListener("DOMContentLoaded", () => {
    const hamburgerButton = document.getElementById("hamburger-button");
    const mobileMenuContainer = document.getElementById(
        "mobile-menu-container"
    );
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileMenuOverlay = document.getElementById("mobile-menu-overlay");
    const closeMenuButton = document.getElementById("close-menu-button");
    const body = document.body;

    function openMenu() {
        mobileMenuContainer.classList.remove("hidden");
        body.classList.add("overflow-hidden");
        hamburgerButton.setAttribute("aria-expanded", "true");
        void mobileMenu.offsetWidth;
        mobileMenu.style.transform = "translateX(0)";
        mobileMenuOverlay.style.opacity = "0.5";
    }

    function closeMenu() {
        hamburgerButton.setAttribute("aria-expanded", "false");
        mobileMenu.style.transform = "translateX(-100%)";
        mobileMenuOverlay.style.opacity = "0";
        setTimeout(() => {
            mobileMenuContainer.classList.add("hidden");
            body.classList.remove("overflow-hidden");
        }, 300);
    }

    hamburgerButton.addEventListener("click", () => {
        const isExpanded =
            hamburgerButton.getAttribute("aria-expanded") === "true";
        if (!isExpanded) {
            openMenu();
        }
    });

    closeMenuButton.addEventListener("click", closeMenu);
    mobileMenuOverlay.addEventListener("click", closeMenu);

    document.addEventListener("keydown", (e) => {
        if (
            e.key === "Escape" &&
            !mobileMenuContainer.classList.contains("hidden")
        ) {
            closeMenu();
        }
    });

    // REVISI: Menutup sidebar saat window di-resize ke ukuran lebih besar
    window.addEventListener("resize", () => {
        // Breakpoint 'md' default Tailwind adalah 768px
        if (
            window.innerWidth >= 768 &&
            !mobileMenuContainer.classList.contains("hidden")
        ) {
            closeMenu();
        }
    });
});

// Button Untuk Ulang Hitung BMI
const recalculateButton = document.getElementById("recalculate-button");
if (recalculateButton) {
    recalculateButton.addEventListener("click", () => {
        localStorage.removeItem("bmiData");
        window.location.href = "./index.html";
    });
}
