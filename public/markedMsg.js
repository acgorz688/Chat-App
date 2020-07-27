var socket = io.connect('http://localhost:4000');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const backBtn = document.getElementById('backBtn')
const username = getInfo();
const markedMessage = document.getElementById('markedMessage');
var tempMarkResult;


//socket 
socket.emit('markedMsgPage',{username:username})

socket.on('loadMarkMessage',data=>{
    for(var i=0;i<data.result.length;i++){
        markedMessage.innerHTML += `<p>${data.result[i].msgtime}</p>
        <p>${data.result[i].senderid}: ${data.result[i].message} 
        <button id="remove" value="${data.result[i].id}" onclick="remove(${data.result[i].id})"/>Remove</button> 
        </p>
        `
    }
});

socket.on('searchMarkedMsgResult',data=>{
    tempMarkResult = markedMessage.innerHTML;
    markedMessage.innerHTML ='';
    for(var i=0;i<data.result.length;i++){
        markedMessage.innerHTML += `<p>${data.result[i].msgtime}</p>
        <p>${data.result[i].senderid}: ${data.result[i].message} 
        <button id="remove" value="${data.result[i].id}" onclick="remove(${data.result[i].id})"/>Remove</button> 
        </p>
        `
    }
});

socket.on('removeMarkedMsg',data=>{
    location.reload();
});


//function 
function remove(id){
    console.log('id: ' + id);
    socket.emit('removeMarkedMsg',{id:id});
}



function getInfo(){
    var url = document.location.toString();
　　var arrUrl = url.split("/");
    var username = arrUrl[4];
    //var groupId = arrUrl[5];
　　return username;
};

// event listener 
searchBtn.addEventListener('click',()=>{
    socket.emit('searchMarkedMsg',{
        username:getInfo(),
        keywords: searchInput.value
    })
});

backBtn.addEventListener('click',()=>{
    markedMessage.innerHTML = tempMarkResult;
    searchInput.value = '';
})


// press key to send
document.onkeydown = function(event){
    var e = event || window.event || arguments.callee.caller.arguments[0];   
    if(e && e.keyCode==13){ // enter  
        if(searchInput.value !=''){
            socket.emit('searchMarkedMsg',{
                username:getInfo(),
                keywords: searchInput.value
            })
            searchInput.value='';
        }else{
            alert('can not search empty!')
        }   
    }  
}