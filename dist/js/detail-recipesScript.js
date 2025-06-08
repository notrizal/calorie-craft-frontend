const CACHE_PREFIX = "recipe_";
const IMPORTANT_NUTRIENTS = [
    "Calories",
    "Protein",
    "Carbohydrates",
    "Fat",
    "Fiber",
    "Sugar",
];

const elements = {};

window.addEventListener("DOMContentLoaded", async () => {
    elements.mainContent = document.querySelector("main");
    elements.loader = document.createElement("div");
    elements.recipeTitle = document.getElementById("recipe-title");
    elements.recipeImage = document.getElementById("recipe-image");
    elements.actionsContainer = document.getElementById("actions-container");
    elements.ingredientsList = document.getElementById("ingredients-list");
    elements.nutritionFacts = document.getElementById("nutrition-facts");
    elements.instructionsContainer = document.getElementById(
        "instructions-container"
    );

    showLoader();

    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get("id");

    if (!recipeId) {
        showError("Recipe ID not found. Please go back and select a recipe.");
        return;
    }

    const cacheKey = `${CACHE_PREFIX}${recipeId}`;
    const cachedRecipe = localStorage.getItem(cacheKey);

    if (cachedRecipe) {
        console.log("Loading recipe from cache...");
        try {
            const recipe = JSON.parse(cachedRecipe);
            console.log("Loading recipes successfully...");
            populatePage(recipe);
        } catch (e) {
            console.error(
                "Failed to parse cached recipe. Fetching from API instead.",
                e
            );
            localStorage.removeItem(cacheKey);
            await fetchAndDisplayRecipe(recipeId);
        }
    } else {
        console.log("No cache found. Fetching recipe from API...");
        await fetchAndDisplayRecipe(recipeId);
    }
});

function showLoader() {
    elements.mainContent.style.display = "none";
    elements.loader.id = "loader";
    elements.loader.className = "flex justify-center items-center h-screen";
    elements.loader.innerHTML =
        '<p class="text-xl font-semibold text-gray-600">Loading recipe details...</p>';
    document.body.insertBefore(elements.loader, elements.mainContent);
}

function hideLoader() {
    elements.loader.style.display = "none";
    elements.mainContent.style.display = "block";
}

function showError(message) {
    console.error("Error:", message);
    elements.mainContent.innerHTML = `<p class="text-center text-red-500">${message}</p>`;
    hideLoader();
}

async function fetchAndDisplayRecipe(recipeId) {
    try {
        const response = await fetch(
            `http://localhost:3000/api/recipes/${recipeId}`
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message ||
                    `Failed to fetch recipe. Status: ${response.status}`
            );
        }
        const recipe = await response.json();

        const cacheKey = `${CACHE_PREFIX}${recipeId}`;
        localStorage.setItem(cacheKey, JSON.stringify(recipe));
        console.log(`Recipe ${recipeId} saved to cache.`);

        populatePage(recipe);
    } catch (error) {
        showError(
            `Sorry, we couldn't load the recipe details. Error: ${error.message}`
        );
    }
}

/**
 * @param {object} recipe
 */
function populatePage(recipe) {
    document.title = `${recipe.title} - CalorieCraft`;
    renderHeader(recipe);
    renderIngredients(recipe.ingredients);
    renderNutrition(recipe.nutrition);
    renderInstructions(recipe);
    renderActions(recipe);
    hideLoader();
}

function renderHeader(recipe) {
    elements.recipeTitle.textContent = recipe.title;
    elements.recipeImage.src = recipe.image;
    elements.recipeImage.alt = recipe.title;
}

function renderIngredients(ingredients) {
    elements.ingredientsList.innerHTML = "";
    if (!ingredients || ingredients.length === 0) {
        elements.ingredientsList.innerHTML = "<li>No ingredients listed.</li>";
        return;
    }
    ingredients.forEach((ingredient) => {
        const div = document.createElement("div");
        div.className = "flex items-center";
        div.innerHTML = `<label class="ml-3 text-gray-700">${ingredient}</label>`;
        elements.ingredientsList.appendChild(div);
    });
}

function renderNutrition(nutrition) {
    elements.nutritionFacts.innerHTML = "";
    if (!nutrition) return;
    nutrition
        .filter((n) => IMPORTANT_NUTRIENTS.includes(n.name))
        .forEach((nutrient) => {
            const div = document.createElement("div");
            div.className = "border-t border-gray-200 pt-4";
            div.innerHTML = `
                <p class="text-sm text-gray-500">${nutrient.name}</p>
                <p class="text-lg font-semibold">${Math.round(
                    nutrient.amount
                )} ${nutrient.unit}</p>
            `;
            elements.nutritionFacts.appendChild(div);
        });
}

function renderInstructions(recipe) {
    elements.instructionsContainer.innerHTML = "";
    if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
        recipe.analyzedInstructions[0].steps.forEach((step) => {
            const div = document.createElement("div");
            div.className = "flex gap-6 items-start";
            div.innerHTML = `
                <div class="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center font-bold text-lg text-gray-600">${step.number}</div>
                <p class="flex-grow text-gray-600">${step.step}</p>
            `;
            elements.instructionsContainer.appendChild(div);
        });
    } else if (recipe.instructions) {
        elements.instructionsContainer.innerHTML = recipe.instructions;
    } else {
        elements.instructionsContainer.innerHTML =
            "<p>No detailed instructions available for this recipe.</p>";
    }
}

function renderActions(recipe) {
    elements.actionsContainer.innerHTML = `
        <div class="flex items-center gap-4">
            <div>
                <p class="font-bold text-green-600 text-2xl">${
                    recipe.spoonacularScore
                        ? recipe.spoonacularScore.toFixed(1)
                        : "N/A"
                }</p>
                <p class="text-xs text-gray-500">Spoonacular Score</p>
            </div>
            <div>
                <p class="font-bold text-blue-600 text-2xl">${
                    recipe.healthScore || "N/A"
                }</p>
                <p class="text-xs text-gray-500">Health Score</p>
            </div>
        </div>
        <div class="relative inline-block">
            <button id="share-btn" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 focus:outline-none"><i class="fa-solid fa-share"></i><span>Share</span></button><div id="copy-notification" class="absolute left-1/2 -translate-x-1/2 top-[-20px] translate-y-full mb-2 bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg transition-opacity duration-300 opacity-0 hidden">Link tersalin!</div>
        </div>

    `;

    const shareButton = document.getElementById("share-btn");
    const copyNotification = document.getElementById("copy-notification");

    let notificationTimeout;

    if (shareButton && copyNotification) {
        shareButton.addEventListener("click", async () => {
            const urlToCopy = window.location.href;
            try {
                await navigator.clipboard.writeText(urlToCopy);

                clearTimeout(notificationTimeout);

                copyNotification.classList.remove("hidden");
                setTimeout(() => {
                    copyNotification.classList.remove("opacity-0");
                }, 10);

                notificationTimeout = setTimeout(() => {
                    copyNotification.classList.add("opacity-0");

                    setTimeout(() => {
                        copyNotification.classList.add("hidden");
                    }, 300);
                }, 2500);

                console.log("URL berhasil disalin ke clipboard:", urlToCopy);
            } catch (err) {
                console.error("Gagal menyalin URL: ", err);

                copyNotification.textContent = "Gagal menyalin!";
            }
        });
    }
}
