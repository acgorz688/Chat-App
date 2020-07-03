var socket = io.connect('http://localhost:4000');
const url = document.URL;
const userId = document.getElementById('userId');
const createGroupBtn = document.getElementById('createGroupBtn');
const singInBtn = document.getElementById('singInBtn');
const homeBtn = document.getElementById('homeBtn');
const logoutBtn = document.getElementById('logout');


socket.emit('workSpace',getInfo(url));

socket.on('workSpace',data=>{
    userId.value = data.user;
    outputNavBar();
    outputList(data.list);

})

function outputNavBar(){
    homeBtn.innerHTML =
    `<a id="homeBtn"class="nav-item nav-link active" 
    href="http://localhost:4000/workSpace/${getInfo(url)}">
    Home <span class="sr-only">(current)</span></a>
    `;

    createGroupBtn.innerHTML =
    ` <a id="createGroupBtn" class="nav-item nav-link" 
    href="http://localhost:4000/${getInfo(url)}/newGroup">
    CREATE GROUP</a>`

    singInBtn.innerHTML =
    ` <a id ="singInBtn"class="nav-item nav-link" 
    href="http://localhost:4000/${getInfo(url)}/joinGroup">
    SING IN</a>
    `

    logoutBtn.innerHTML =
    ` <button id ="logoutBtn" type="button" class="btn btn-danger">
    Log Out</button>
    `
}

function outputList(list){
    for(var i=0;i<list.length;i++){
        groupList.innerHTML += 
        `
        <h5 class="userGroup">
        <img src="https://dynamic.brandcrowd.com/asset/logo/706a61b9-03c8-4c99-a0ac-18abbe326685/logo?v=4" 
        width="60" height="60" class="d-inline-block align-top" alt="" loading="lazy">
        ${list[i]}
        <button class="groupBtn"
        type = "submit"
        name = "groupBtn"
        value = "${list[i]}">
       launch
        </button>
        
        </h5>
        `;

    }
}

function getInfo(url){
    var url = document.location.toString();
　　var arrUrl = url.split("/");
    var user = arrUrl[4];
　　return user;
};

logoutBtn.addEventListener('click',()=>{
    console.log('logout...');
    socket.emit('logout',{
        user:getInfo()
    })
    window.location.href="http://localhost:4000/login"
})