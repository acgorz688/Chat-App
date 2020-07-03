const homeBtn = document.getElementById('homeBtn');


outputNavBar();

function outputNavBar(){
    homeBtn.innerHTML =
    `<a id="homeBtn"class="nav-item nav-link active" 
    href="http://localhost:4000/login">
    Home <span class="sr-only">(current)</span></a>
    `;
}