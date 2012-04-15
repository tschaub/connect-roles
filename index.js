var functionList = [];
var failureHandler = function (req, res, action){
	res.send(403);
};
var defaultUser = {};
module.exports = function middleware(req, res, next){
  var oldUser = req.user;
  req.user = req.user || Object.create(defaultUser);
  if(oldUser){
    req.user.isAuthenticated = true;
  }else{
    req.user.isAuthenticated = false;
  }
	if(req.user){
		req.user.is = tester(req);
		req.user.can = tester(req);
	}
	next();
};




module.exports.can = routeTester;
module.exports.is = routeTester;
module.exports.isAuthenticated = function(req,res,next){
	if(arguments.length === 0) return module.exports.isAuthenticated;
	if (req.user && req.user.isAuthenticated) next();
	else if(req.user) failureHandler(req, res, "isAuthenticated");
	else throw "Request.user was null or undefined, include middleware";
};

module.exports.useAuthorisationStrategy = 
module.exports.useAuthorizationStrategy = function(path, fn){
	if(typeof path === "function"){
		fn = path
	}
	functionList.push(function(user, action, stop){
		if(typeof path === "string" && path != action){
			return null;
		}
		
		return fn.call(this, user, action, stop);
	});
	return this;
};
module.exports.setFailureHandler = function(fn){
	failureHandler = fn;
};
module.exports.setDefaultUser = function(user){
  defaultUser = user;
};


function tester(req){
	return function(action){
		var result = null,
			vote;
		var stop = false;
		function stopNow(vote){
			stop = true;
        	if (vote === false) result = false;
        	else if (vote === true) result = true;

		}
    	for (var i = 0; i<functionList.length && !stop; i++){
    		var fn = functionList[i];
        	vote = fn.call(req, req.user, action, stop);
        	if(vote === false) return false;
        	else if (vote === true) result = true;
    	}
    	return (result === true);
	}
}

function routeTester(action){		
	return function(req,res,next){
		if(tester(req)(action)){
			next();
		}else{
			//Failed authentication.
			failureHandler(req, res, action);		
		}
	};
};