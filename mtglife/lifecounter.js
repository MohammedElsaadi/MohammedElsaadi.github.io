window.onload = function() {
	var land = false;
    while(land == false){
     ( window.orientation == 0 || window.orientation == 180 ) { 
        alert ('Please use your mobile device in landscape mode'); 
    	}
    	if (window.orientation != 0 && window.orientation != 180){
    		land = true;
    	}
    }
};
var cont = document.getElementById("allContainer");