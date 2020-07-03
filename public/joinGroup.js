var socket = io.connect('http://localhost:4000');
const url = document.URL;
const joinGroupName = document.getElementById('joinGroupName');
const joinPassword = document.getElementById('joinPassword');
const joinGroupBtn = document.getElementById('joinGroupBtn');
const joinGroupError = document.getElementById('joinGroupError');
const createGroupBtn = document.getElementById('createGroupBtn');
const homeBtn = document.getElementById('homeBtn');
const logoutBtn = document.getElementById('logout');

outputNavBar();

socket.on('joinGroupError',data=>{
    joinGroupError.innerHTML = data.err;
});

socket.on('joinGroup',data=>{
    window.location.href = `http://localhost:4000/workSpace/${data.username}/${data.groupname}`;
})

joinGroupBtn.addEventListener('click',()=>{
    socket.emit('joinGroup',{
        groupName:joinGroupName.value,
        groupPassword: joinPassword.value,
        username:getInfo(),
        socketid:socket.id
    });
    joinGroupName.innerHTML='';
    joinPassword.innerHTML='';
});

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

function getInfo(url){
    var url = document.location.toString();
　　var arrUrl = url.split("/");
    var user = arrUrl[3];
　　return user;
};

logoutBtn.addEventListener('click',()=>{
    console.log('logout...');
    socket.emit('logout',{
        user:getInfo()
    })
    window.location.href="http://localhost:4000/login"
})