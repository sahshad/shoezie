let selectedCategories = [];
let selectedSizes = [];
const sizes = [
        3, 3.5, 4, 4.5, 5, 5.5,
        6, 6.5, 7, 7.5, 8, 8.5,
        9, 9.5, 10, 10.5, 11, 11.5,
        12
    ];
    const sizeFilter = document.getElementById('sizeFilter');

    sizes.forEach(size => {
        const button = document.createElement('button');
        button.value = size;
        button.textContent = size;
        button.onclick = () => toggleSize(button);
        sizeFilter.appendChild(button);
    });

    function setSelectedSortOption() {
        const urlParams = new URLSearchParams(window.location.search);
        const sortedBy = urlParams.get('sortedby');
        if (sortedBy) {
            document.getElementById('sortOptions').value = sortedBy; 
        }
    }
    window.onload = setSelectedSortOption;

    function sortProducts() {
        const sortOption = document.getElementById('sortOptions').value;
        const categoryFilter = document.getElementById('categoryFilter').value;

        const queryParams = new URLSearchParams(window.location.search);
        queryParams.delete('sortedby')
        if (sortOption) queryParams.append('sortedby', sortOption);

        window.location.href = `/user/shop/filter?${queryParams.toString()}`;
    }

    function toggleFilter() {
        const productContainer = document.getElementById('productContainer')
        const productCard = document.querySelectorAll('.productCard')

        const filterOptions = document.getElementById('filterOptions');
        if (filterOptions.style.display === 'none' || filterOptions.style.display === '') {
            filterOptions.style.display = 'block';

           productCard.forEach(card =>{
            card.classList.remove('col-md-3')
            card.classList.add('col-md-4')
           })
            productContainer.classList.remove('col-md-12')
            productContainer.classList.add('col-md-9')
        } else {
            productCard.forEach(card =>{
            card.classList.remove('col-md-4')
            card.classList.add('col-md-3')

           })
            productContainer.classList.remove('col-md-9')
            productContainer.classList.add('col-md-12')
            filterOptions.style.display = 'none';
        }
    }

    function filterProducts() {
        sortProducts();
    }

    function toggleSize(button) {
    const buttons = document.querySelectorAll('.size-buttons button');

    if (button.classList.contains('selected')) {
       button.classList.remove('selected')
       const valueIndex = selectedSizes.indexOf(button.value);
        if (valueIndex > -1) {
            selectedSizes.splice(valueIndex, 1);
        }
    } else {
        button.classList.add('selected');
        selectedSizes.push(button.value)
    }
    console.log(selectedSizes);
}

function toggleCategory(checkbox) {
    if (checkbox.checked) {
        selectedCategories.push(checkbox.value);
    } else {
        selectedCategories = selectedCategories.filter(category => category !== checkbox.value);
    }
    console.log(selectedCategories);  
}

function applyFilters() {
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.delete('sizes');
    queryParams.delete('categories');

    if (selectedSizes.length > 0) {
        queryParams.append('sizes', JSON.stringify(selectedSizes));
    }

    if (selectedCategories.length > 0) {
        queryParams.append('categories', JSON.stringify(selectedCategories));
    }

    window.location.href = `/user/shop/filter?${queryParams.toString()}`;
}

    document.addEventListener("DOMContentLoaded", function() {
        function getQueryParams() {
            const params = new URLSearchParams(window.location.search);
            return {
                sizes: params.get('sizes') ? JSON.parse(params.get('sizes')) : [],
                categories: params.get('categories') ? JSON.parse(params.get('categories')) : [],
                searchValue : params.get('search')
            };
        }

        function highlightSelectedFilters() {
            const { sizes, categories,searchValue } = getQueryParams();
            categories.forEach(categoryId => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${categoryId}"]`);
                if (checkbox) {
                    checkbox.checked = true; 
                    selectedCategories.push(checkbox.value)
                }
            });

            sizes.forEach(size => {
                const sizeButton = document.querySelector(`.size-buttons button[value="${size}"]`);
                if (sizeButton) {
                    sizeButton.classList.add('selected'); 
                    selectedSizes.push(sizeButton.value)
                }
            });

            if (searchValue) {
             document.getElementById('searchInput').value = searchValue;
            }
        }
        highlightSelectedFilters();
    });

    function performSearch(event) {
    event.preventDefault(); 

    const searchInput = document.getElementById('searchInput').value.trim();
    if (searchInput) {
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.set('search', searchInput); 
        window.location.href = `/user/shop/filter?${queryParams.toString()}`; 
    }
}