
function handle_pointerLock (canvas, cb_enabled, cb_disabled, cb_error) {

    //
    //
    // // // POINTER LOCK

    canvas.requestPointerLock = canvas.requestPointerLock ||
                                canvas.mozRequestPointerLock ||
                                canvas.webkitRequestPointerLock;

    document.exitPointerLock =  document.exitPointerLock ||
                                document.mozExitPointerLock ||
                                document.webkitExitPointerLock;

    canvas.onclick = function() {
        canvas.requestPointerLock();
    }

    if ("onpointerlockchange" in document)
        document.addEventListener('pointerlockchange', lockChangeAlert, false);
    else if ("onmozpointerlockchange" in document)
        document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
    else if ("onwebkitpointerlockchange" in document)
        document.addEventListener('webkitpointerlockchange', lockChangeAlert, false);

    if ("onpointerlockerror" in document)
        document.addEventListener('pointerlockerror', lockError, false);
    else if ("onmozpointerlockerror" in document)
        document.addEventListener('mozpointerlockerror', lockError, false);
    else if ("onwebkitpointerlockerror" in document)
        document.addEventListener('webkitpointerlockerror', lockError, false);

    function lockChangeAlert() {
        if (document.pointerLockElement === canvas ||
            document.mozPointerLockElement === canvas ||
            document.webkitPointerLockElement === canvas)
        {
            console.log('The pointer lock status is now locked');
            // Do something useful in response

            if (cb_enabled)
                cb_enabled();

        } else {
            console.log('The pointer lock status is now unlocked');      
            // Do something useful in response

            if (cb_disabled)
                cb_disabled();
        }
    }


    function lockError(e) {
        console.error("Pointer lock failed"); 

        if (cb_error)
            cb_error(e)
    }

    

    // // // POINTER LOCK
    //
    //

}

module.exports = handle_pointerLock;
