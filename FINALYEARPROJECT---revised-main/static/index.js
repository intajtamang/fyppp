let addedTexts = {};
let selectedDate = getCurrentDate(); 
function showViolationLog() {
    document.getElementById("mainContainer").style.display = "none";
    document.getElementById("listboxContainer").style.display = "block";
}

function showHome() {
    document.getElementById("mainContainer").style.display = "block";
    document.getElementById("listboxContainer").style.display = "none";
}
// Fetching number plate images from the backend
             function fetchNumberPlateImages() {
                fetch('/api/number_plate_images', { method: 'GET' })
                    .then(response => response.json())
                    .then(data => {
                        updateImages(data.NumberPlateImages);
                    })
                    .catch(error => console.error('Error fetching number plate images:', error));
            }
            setInterval(fetchNumberPlateImages,15000);     
   
   // Function to update the images container
        function updateImages(images) {
            document.getElementById('imagesContainer');
            const ul = document.getElementById('imageList');
            ul.innerHTML='';
            images.forEach(image => {
                const li = document.createElement('li');
                const imgElement = document.createElement('img');
                const timestamp = new Date().getTime();  // Add a timestamp to force reload
                imgElement.src = `/number_plate_images/${image}?t=${timestamp}`;
                imgElement.alt = 'Number Plate Image';
                imgElement.addEventListener('click', function () {
                            handleImageClick(image);
                        });
    
                li.appendChild(imgElement);
                ul.appendChild(li);
            });
        }


// Function to handle image click
 function handleImageClick(image) {  
    
        if (addedTexts.hasOwnProperty(image)) {
            alert('Number Plate for this image has already been added!');
            return;
        } 

        var popup = document.getElementById("popup_box");
        var span = document.getElementsByClassName("close")[0];
        var popup_btn = document.getElementById('popup_btn');
        var plateInput = document.getElementById("plateInput");
        plateInput.value = ''; 
        popup.style.display = "block";
        span.onclick = function() {
            popup.style.display = "none";
        };
        currentImage = image;
        plateInput.addEventListener('input',function(){
            plateInput.style.borderColor = "";
            plateInput.placeholder="";
        });
        popup_btn.onclick = function() {
                let enteredText = document.getElementById("plateInput").value;

                if (enteredText.trim() === '') {
                
                    plateInput.placeholder = "Please enter the text !";
                    plateInput.style.borderColor = "red";
                    return;
                } 
                else {
                    popup.style.display = "none";
                    const messageContainer = document.getElementById('messageContainer');
                    const messageText = document.getElementById('messageText');
                    messageText.textContent = 'Number Plate Added';
                    messageContainer.style.display = 'block';
                    setTimeout(function() {
                        messageContainer.style.display = 'none';
                    }, 3000);
                    //alert('Number Plate Added');
                    addedTexts[currentImage] = enteredText;
                    console.log(addedTexts);
                    updateListbox(currentImage, enteredText, selectedDate);
                }
            };
        }   

     function updateListbox(image, text, selectedDate) {
        fetch('/api/save_added_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image, text, date: selectedDate }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Number plate added:', data);
            // After adding, reload the texts to update the listbox
            loadAndDisplayTexts();
        })
        .catch(error => {
            console.error('Error saving added text:', error);
            alert('Failed to save added text. Please try again.');
        });
    }
         

 function loadAndDisplayTexts() {
    fetch('/api/get_added_texts', { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            const addedTexts = data.addedTexts;
            console.log('Fetched Data:', addedTexts);
            updateListboxBasedOnDate(addedTexts);
            
        })
        .catch(error => console.error('Error fetching added texts:', error)); 
}

function updateListboxBasedOnDate(addedTexts) {
    const listboxContainer = document.getElementById('listboxContainer');
    const existingParagraphs = listboxContainer.querySelectorAll('p');
    const existingButtons = listboxContainer.querySelectorAll('button');
    
    console.log(existingParagraphs);
    // Iterating over existing paragraphs to keep them if they match the selected date
    existingParagraphs.forEach(paragraph => {
        const imageFileName = paragraph.dataset.imageFileName;
        console.log(imageFileName);
        if (!addedTexts[imageFileName] || addedTexts[imageFileName].date !== selectedDate) {
            paragraph.remove(); 
        }
    });

    existingButtons.forEach(button => {
        const imageFileName = button.dataset.imageFileName;
        if (!addedTexts[imageFileName] || addedTexts[imageFileName].date !== selectedDate) {
            button.remove();
        }
    });

    for (const image in addedTexts) {
        const { text, date } = addedTexts[image];
        if (date === selectedDate) {  
                const container = document.createElement('div');
                container.classList.add('ptag-btn'); 
                const pElement = document.createElement('p');
                pElement.textContent = text;
                
                const viewBtn = document.createElement('button');
                viewBtn.textContent = "View";
                container.appendChild(pElement);
                container.appendChild(viewBtn);
                listboxContainer.appendChild(container);  
                addedTexts[text] = true;
                
        }
    }
}

function getCurrentDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    let month = currentDate.getMonth() + 1;
    month = month < 10 ? '0' + month : month;
    let day = currentDate.getDate();
    day = day < 10 ? '0' + day : day;
    return `${year}-${month}-${day}`;
}
document.getElementById('selectedDate').value = selectedDate;

function handleDateChange() {
    const dateInput = document.getElementById('selectedDate');
    selectedDate = dateInput.value;
    loadAndDisplayTexts();
}
loadAndDisplayTexts();         