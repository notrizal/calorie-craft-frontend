const ITEMS_PER_PAGE = 20;

const appState = {
    allRecipes: [],
    categorizedRecipes: {},
    currentCategory: "All",
    currentSearchTerm: "",
    currentPage: 1,
    isLoading: true,
    error: null,
};

window.addEventListener("DOMContentLoaded", async () => {
    initializePage();
});

async function initializePage() {
    try {
        const bmiData = JSON.parse(localStorage.getItem("bmiData"));
        console.log(bmiData);
        if (!bmiData || !bmiData.recipes || !bmiData.recipes.length) {
            window.location.href = "./index.html";
            throw new Error(
                "Recipe data not found. Please calculate your BMI first."
            );
        }

        appState.allRecipes = bmiData.recipes;
        appState.categorizedRecipes = categorizeRecipesOffline(bmiData.recipes);
        appState.isLoading = false;

        // BMI Status Display

        const bmiStatus = document.getElementById("bmi-status");
        bmiStatus.textContent = bmiData.category.split(" ")[0];

        const statusClasses = [
            "bg-blue-100",
            "text-blue-800",
            "bg-green-100",
            "text-green-800",
            "bg-yellow-100",
            "text-yellow-800",
            "bg-red-100",
            "text-red-800",
        ];

        bmiStatus.classList.remove(...statusClasses);

        if (bmiData.category === "Underweight") {
            bmiStatus.classList.add("bg-blue-100", "text-blue-800");
        } else if (bmiData.category === "Normal weight") {
            bmiStatus.classList.add("bg-green-100", "text-green-800");
        } else if (bmiData.category === "Overweight") {
            bmiStatus.classList.add("bg-yellow-100", "text-yellow-800");
        } else if (bmiData.category === "Obesity") {
            bmiStatus.classList.add("bg-red-100", "text-red-800");
        }

        setupCategoryFilters();
        setupSearchFilter();
        updateDisplay();
    } catch (error) {
        console.error("Initialization failed:", error);
        appState.error = error.message;
        updateDisplay();
    }
}

function setupCategoryFilters() {
    const container = document.getElementById("category");
    if (!container) return;
    container.innerHTML = "";

    const allButton = createFilterButton("All", appState.allRecipes.length);
    container.appendChild(allButton);

    const categories = Object.keys(appState.categorizedRecipes).sort();
    categories.forEach((category) => {
        const button = createFilterButton(
            category,
            appState.categorizedRecipes[category].length
        );
        container.appendChild(button);
    });

    container.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (button && button.dataset.category) {
            appState.currentCategory = button.dataset.category;
            appState.currentPage = 1;
            updateDisplay();
        }
    });
}

function setupSearchFilter() {
    const searchInput = document.getElementById("filter-input");
    if (!searchInput) return;
    searchInput.addEventListener("input", (event) => {
        appState.currentSearchTerm = event.target.value.toLowerCase();
        appState.currentPage = 1;
        updateDisplay();
    });
}

function updateDisplay() {
    if (appState.error) {
        document.getElementById(
            "recipes-wrapper"
        ).innerHTML = `<p class="col-span-full text-center text-red-500">${appState.error}</p>`;
        document.getElementById("pagination-wrapper").innerHTML = "";
        return;
    }

    let recipesToFilter =
        appState.currentCategory === "All"
            ? appState.allRecipes
            : appState.categorizedRecipes[appState.currentCategory] || [];

    const finalRecipes = recipesToFilter.filter((recipe) =>
        recipe.title.toLowerCase().includes(appState.currentSearchTerm)
    );

    const totalPages = Math.ceil(finalRecipes.length / ITEMS_PER_PAGE);

    if (appState.currentPage > totalPages) {
        appState.currentPage = totalPages || 1;
    }

    const startIndex = (appState.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedRecipes = finalRecipes.slice(startIndex, endIndex);

    renderRecipes(paginatedRecipes);
    renderPagination(totalPages);
    updateActiveFilterButton();
}

/**
 * @param {Array<object>} recipes
 */
function renderRecipes(recipes) {
    const recipesWrapper = document.getElementById("recipes-wrapper");
    recipesWrapper.innerHTML = "";

    if (recipes.length === 0) {
        recipesWrapper.innerHTML =
            '<p class="col-span-full text-center text-gray-500">No recipes found matching your criteria.</p>';
        return;
    }

    recipes.forEach((recipe) => {
        const article = document.createElement("article");
        article.className =
            "cursor-pointer group transform transition-transform hover:scale-[1.01]";
        article.dataset.recipeId = recipe.id;
        article.innerHTML = `
            <div class="overflow-hidden rounded-lg shadow-md group-hover:shadow-xl transition-shadow">
                <img src="${recipe.image}" alt="${recipe.title}" class="w-full h-40 object-cover"/>
                <div class="p-4">
                    <h3 class="font-semibold text-gray-900 truncate group-hover:text-green-600">${recipe.title}</h3>
                    <p class="text-sm text-gray-500">${recipe.readyInMinutes} min • ${recipe.calories}</p>
                </div>
            </div>
        `;
        article.addEventListener("click", () => {
            window.location.href = `./detail-recipes.html?id=${recipe.id}`;
        });
        recipesWrapper.appendChild(article);
    });
}

/**
 * @param {number} totalPages - Total jumlah halaman.
 */

function renderPagination(totalPages) {
    const paginationWrapper = document.getElementById("pagination-wrapper");
    paginationWrapper.innerHTML = ""; // Selalu bersihkan

    if (totalPages <= 1) {
        return;
    }

    const createButton = (text, page, isDisabled = false, isActive = false) => {
        const button = document.createElement("button");
        button.textContent = text;
        button.dataset.page = page;
        button.disabled = isDisabled;

        let baseClasses =
            "px-3 py-2 text-sm font-medium rounded-md border transition-colors";
        if (window.innerWidth < 640) {
            baseClasses =
                "px-2.5 py-1.5 text-sm font-medium rounded-md border transition-colors";
        }

        if (isActive) {
            button.className = `${baseClasses} bg-gray-900 text-white border-gray-900`;
        } else if (isDisabled) {
            button.className = `${baseClasses} bg-white border-gray-300 opacity-50 cursor-not-allowed`;
        } else {
            button.className = `${baseClasses} bg-white border-gray-300 hover:bg-gray-100`;
        }

        return button;
    };

    const createEllipsis = () => {
        const span = document.createElement("span");
        span.textContent = "...";
        span.className = "px-3 py-2 text-sm text-gray-500";
        return span;
    };

    const prevButton = createButton(
        "Prev",
        appState.currentPage - 1,
        appState.currentPage === 1
    );
    paginationWrapper.appendChild(prevButton);

    if (totalPages <= 4) {
        for (let i = 1; i <= totalPages; i++) {
            paginationWrapper.appendChild(
                createButton(i, i, false, i === appState.currentPage)
            );
        }
    } else {
        const currentPage = appState.currentPage;
        let pagesToShow = [];

        pagesToShow.push(1);

        if (currentPage > 3) {
            pagesToShow.push("...");
        }

        if (currentPage > 2) pagesToShow.push(currentPage - 1);
        if (currentPage !== 1 && currentPage !== totalPages)
            pagesToShow.push(currentPage);
        if (currentPage < totalPages - 1) pagesToShow.push(currentPage + 1);

        if (currentPage < totalPages - 2) {
            pagesToShow.push("...");
        }

        pagesToShow.push(totalPages);
        const uniquePages = [...new Set(pagesToShow)];

        uniquePages.forEach((page) => {
            if (page === "...") {
                paginationWrapper.appendChild(createEllipsis());
            } else {
                paginationWrapper.appendChild(
                    createButton(page, page, false, page === currentPage)
                );
            }
        });
    }

    // Tombol "Next"
    const nextButton = createButton(
        "Next",
        appState.currentPage + 1,
        appState.currentPage === totalPages
    );
    paginationWrapper.appendChild(nextButton);

    paginationWrapper.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (button && !button.disabled && button.dataset.page) {
            appState.currentPage = parseInt(button.dataset.page, 10);
            updateDisplay();
        }
    });
}

function updateActiveFilterButton() {
    const allButtons = document.querySelectorAll("#category button");
    allButtons.forEach((button) => {
        const isActive = button.dataset.category === appState.currentCategory;
        button.classList.toggle("bg-gray-900", isActive);
        button.classList.toggle("text-white", isActive);
        button.classList.toggle("bg-gray-100", !isActive);
        button.classList.toggle("text-gray-700", !isActive);
    });
}

/**
 * @param {string} categoryName
 * @param {number} count
 * @returns {HTMLButtonElement}
 */
function createFilterButton(categoryName, count) {
    const button = document.createElement("button");
    button.className =
        "py-2 px-4 rounded-full text-sm font-medium transition-colors";
    button.dataset.category = categoryName;
    button.textContent = `${categoryName} (${count})`;
    return button;
}

function categorizeRecipesOffline(recipes) {
    const rules = [
        {
            name: "Pasta Dishes",
            keywords: [
                "pasta",
                "lasagna",
                "spaghetti",
                "fettuccine",
                "linguine",
                "carbonara",
                "bolognese",
            ],
        },
        { name: "Pizza", keywords: ["pizza"] },
        {
            name: "Soups & Stews",
            keywords: ["soup", "stew", "chowder", "bisque", "goulash"],
        },
        { name: "Salads", keywords: ["salad"] },
        {
            name: "Sandwiches & Burgers",
            keywords: ["sandwich", "burger", "sliders", "wrap"],
        },
        {
            name: "Seafood & Fish",
            keywords: [
                "seafood",
                "shrimp",
                "salmon",
                "tuna",
                "cod",
                "fish",
                "prawn",
                "scallop",
            ],
        },
        { name: "Chicken Dishes", keywords: ["chicken"] },
        {
            name: "Beef & Red Meat",
            keywords: [
                "beef",
                "steak",
                "brisket",
                "pork",
                "bacon",
                "ham",
                "venison",
            ],
        },
        {
            name: "Vegetarian & Plant-Based",
            keywords: [
                "vegetarian",
                "vegan",
                "veggie",
                "lentil",
                "chickpea",
                "tofu",
                "tempeh",
                "quinoa",
                "bean",
            ],
        },
        {
            name: "Desserts",
            keywords: [
                "cake",
                "cookie",
                "pie",
                "dessert",
                "brownie",
                "ice cream",
                "pudding",
            ],
        },
        {
            name: "Appetizers & Snacks",
            keywords: [
                "appetizer",
                "snack",
                "dip",
                "finger food",
                "starter",
                "pesto",
            ],
        },
        {
            name: "Breakfast",
            keywords: ["breakfast", "pancake", "waffle", "omelet", "egg"],
        },
    ];
    const defaultCategory = "Other Delicious Dishes";
    const categorized = {};
    if (!recipes) return categorized;
    recipes.forEach((recipe) => {
        let foundCategory = false;
        for (const rule of rules) {
            if (
                rule.keywords.some((keyword) =>
                    recipe.title.toLowerCase().includes(keyword)
                )
            ) {
                if (!categorized[rule.name]) categorized[rule.name] = [];
                categorized[rule.name].push(recipe);
                foundCategory = true;
                break;
            }
        }
        if (!foundCategory) {
            if (!categorized[defaultCategory])
                categorized[defaultCategory] = [];
            categorized[defaultCategory].push(recipe);
        }
    });
    return categorized;
}
