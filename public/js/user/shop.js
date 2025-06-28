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
    
    function toggleClearFilter(){
        const clearFilter = document.getElementById('clearFilter')

        if(selectedCategories.length > 0 || selectedSizes.length>0){
            clearFilter.style.display = 'block'
         }else{
            clearFilter.style.display = 'none'
         }
    }

    let filterToggleOpened = false

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

        if(filterOptions.style.display === 'none')
            filterToggleOpened = false
        else
           filterToggleOpened = true
    }

    async function sortProducts() {
        const sortOption = document.getElementById('sortOptions').value;
    
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.delete('sortedby');
        if (sortOption) queryParams.append('sortedby', sortOption);
       
        const requestUrl = `/shop/filter?${queryParams.toString()}`

        window.history.pushState({},'',requestUrl)
    
        try {
            const response = await fetch(requestUrl, {
                method: 'GET', 
                headers: {
                    'Accept': 'application/json' 
                }
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
    
            displayProducts(data.products); 
            updatePaginationUI(data.currentPage, data.totalPages, data.limit);
        } catch (error) {
            console.error('Error fetching sorted products:', error);
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
    applyFilters()
    toggleClearFilter()
}

function toggleCategory(checkbox) {
    if (checkbox.checked) {
        selectedCategories.push(checkbox.value);
    } else {
        selectedCategories = selectedCategories.filter(category => category !== checkbox.value);
    }
    console.log(selectedCategories);  
    applyFilters()
    toggleClearFilter()
}

async function clearFilter(){
    const queryParams = new URLSearchParams(window.location.search);
        queryParams.delete('sizes');
        queryParams.delete('categories');
        queryParams.delete('limit')
        queryParams.delete('page')

        const requestUrl = `/shop/filter?${queryParams.toString()}`
        window.history.pushState({},'',requestUrl)

        try {
            const response = await fetch(requestUrl, {
                method: 'GET', 
                headers: {
                    'Accept': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const buttons = document.querySelectorAll('.size-buttons button');
            const checkBoxes = document.querySelectorAll('.checkbox');

           checkBoxes.forEach(checkbox =>{
                    if(checkbox.checked){
                       checkbox.checked = false; 
                    }
           })
            selectedCategories = [];
        
           buttons.forEach(button =>{
            if (button.classList.contains('selected')) {
                button.classList.remove('selected')
                const valueIndex = selectedSizes.indexOf(button.value);
                 if (valueIndex > -1) {
                     selectedSizes.splice(valueIndex, 1);
                 }
             }
           })

           const clearFilter = document.getElementById('clearFilter')
           clearFilter.style.display = 'none'

           
            const data = await response.json();
    
            displayProducts(data.products);
            updatePaginationUI(data.currentPage, data.totalPages, data.limit);
        } catch (error) {
            console.error('Error fetching filtered products:', error);
        }
}


    async function applyFilters() {
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.delete('sizes');
        queryParams.delete('categories');
        queryParams.delete('limit')
        queryParams.delete('page')
    
        if (selectedSizes.length > 0) {
            queryParams.append('sizes', JSON.stringify(selectedSizes));
        }
    
        if (selectedCategories.length > 0) {
            queryParams.append('categories', JSON.stringify(selectedCategories));
        }
        const requestUrl = `/shop/filter?${queryParams.toString()}`
        window.history.pushState({},'',requestUrl)
        try {
            const response = await fetch(requestUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            const data = await response.json();
    
            displayProducts(data.products);
            updatePaginationUI(data.currentPage, data.totalPages, data.limit);
        } catch (error) {
            console.error('Error fetching filtered products:', error);
        }
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
                const checkbox = document.querySelector(`input[type="checkbox"][value="${categoryId}"]`)
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

let debounceTimer;

function performSearch(event) {
    clearTimeout(debounceTimer); 

    const searchInput = event.target.value; 

    debounceTimer = setTimeout(() => {
        if (searchInput) {
            const queryParams = new URLSearchParams(window.location.search);
            queryParams.delete('limit')
            queryParams.delete('page')
            queryParams.set('search', searchInput)
            const requestUrl = `/shop/filter?${queryParams.toString()}`;

            window.history.pushState({}, '', requestUrl);
            
            fetch(requestUrl,{
                method: 'GET', 
                headers: {
                    'Accept': 'application/json' 
                }
            })
                .then(response => response.json())
                .then(data => {
                    displayProducts(data.products); 
                    updatePaginationUI(data.currentPage, data.totalPages, data.limit);
                })
                .catch(error => console.error('Error:', error));
        } else {
 
            const queryParams = new URLSearchParams(window.location.search);
            queryParams.delete('search');
            const requestUrl = `/shop/filter?${queryParams.toString()}`
            window.history.pushState({}, '', requestUrl);

            fetch(requestUrl,{
                headers: {
                    'Accept': 'application/json'
                }
            }) 
                .then(response => response.json())
                .then(data => {
                    displayProducts(data.products); 
                    updatePaginationUI(data.currentPage, data.totalPages, data.limit);
                })
                .catch(error => console.error('Error fetching all products:', error));
        }
    }, 300); 
}

function displayProducts(products) {
    const productsContainer = document.getElementById('productContainer').querySelector('.row');
    productsContainer.innerHTML = '';

    if (products.length === 0) {
        productsContainer.innerHTML = '<p>No products found.</p>';
        return;
    }

    products.forEach(product => {
        console.log(filterToggleOpened);
        
        const productElement = document.createElement('div');
        productElement.className = filterToggleOpened ? 'col-md-4 mb-4 productCard':'col-md-3 mb-4 productCard'
        productElement.innerHTML = 
        `<a href="/shop/${product._id}  " class="card-link">
        <div class="card">
            <img src="${product.imageUrls[0]} " class="card-img-top fixed-height" style="height: 255px; object-fit: cover;" alt="Product 1">
            <div class="card-body p-0" style="text-align: left;">
                <div>
                    <p class="card-title font-weight-bold my-2">${product.name} </p>
                    <div class="star-rating">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star-half-alt"></i>
                        <span>(4.5)</span>
                    </div>
                    <p class="category">${product.category.name } Shoe</p>
                                    <p class="price">
                    ${product.bestOffer ? `
                        <span style="text-decoration: line-through; color: rgb(175, 175, 175); margin-right: 5px;">₹ ${product.price}</span> 
                        ${
                            product.bestOffer.offerType === 'percentage' ? `
                                ${product.bestOffer.maxDiscount ? `
                                    ${ (product.price * product.bestOffer.value / 100) > product.bestOffer.maxDiscount ? 
                                        `₹ ${(product.price - product.bestOffer.maxDiscount).toFixed(2)}` : 
                                        `₹ ${(product.price - (product.price * product.bestOffer.value / 100)).toFixed(2)}` 
                                    }` 
                                : 
                                    `₹ ${(product.price - (product.price * product.bestOffer.value / 100)).toFixed(2)}`
                            }` 
                        : 
                        `₹ ${(product.price - product.bestOffer.value).toFixed(2)}`
                    }` : 
                    `₹ ${product.price.toFixed(2)}`
                    }
                </p>
                </div>
            </div>
        </div>
    </a>`
        productsContainer.appendChild(productElement);
    });
}

async function handlePaginagation(page, limit) {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set('page', page);
  urlParams.set('limit', limit);

  const requestUrl = `/shop/filter?${urlParams.toString()}`;
  window.history.pushState({}, '', requestUrl);

  try {
    const response = await fetch(requestUrl, {
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    displayProducts(data.products);
    updatePaginationUI(data.currentPage, data.totalPages, data.limit);
  } catch (err) {
    console.error('Error during pagination fetch:', err);
  }
}

function updatePaginationUI(currentPage, totalPages, limit) {
  const paginationContainer = document.getElementById('paginationContainer');
  paginationContainer.innerHTML = ''; // Clear existing buttons

  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (currentPage > 1) {
    paginationContainer.innerHTML += `
      <li class="page-item">
        <a class="page-link" onclick="handlePaginagation(${currentPage - 1}, ${limit})">Previous</a>
      </li>`;
  }

  if (startPage > 1) {
    paginationContainer.innerHTML += `
      <li class="page-item"><a class="page-link" onclick="handlePaginagation(1, ${limit})">1</a></li>`;
    if (startPage > 2) {
      paginationContainer.innerHTML += `
        <li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationContainer.innerHTML += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" onclick="handlePaginagation(${i}, ${limit})">${i}</a>
      </li>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationContainer.innerHTML += `
        <li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    paginationContainer.innerHTML += `
      <li class="page-item">
        <a class="page-link" onclick="handlePaginagation(${totalPages}, ${limit})">${totalPages}</a>
      </li>`;
  }

  if (currentPage < totalPages) {
    paginationContainer.innerHTML += `
      <li class="page-item">
        <a class="page-link" onclick="handlePaginagation(${currentPage + 1}, ${limit})">Next</a>
      </li>`;
  }
}
