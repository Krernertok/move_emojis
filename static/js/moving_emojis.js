var movingEmojis = (function() {

    const UPDATE_INTERVAL = 33;
    var $container = $('#container');
    var draggedId = null;
    var dragOffset = {
        top: null,
        left: null
    };
    var mouseCoordinates = {
        x: null,
        y: null
    };

    var positions = [
        {  
            id: 0,
            url: "http://emojipedia-us.s3.amazonaws.com/cache/a7/0e/a70ed4d5e4062aab6c4ac24892ee6763.png",
            description: "grinning"
       },
       {  
            id: 1,
            url: "http://emojipedia-us.s3.amazonaws.com/cache/0d/4a/0d4a6907a21382c60c80bf93c293926e.png",
            description: "grin"
       },
       {
            id: 2,
            url: "http://emojipedia-us.s3.amazonaws.com/cache/6c/41/6c41322d281041cde5db1976403743ce.png",
            description: "sleepy"
       },
       {  
            id: 3,
            url: "http://emojipedia-us.s3.amazonaws.com/cache/0c/ef/0cefeced6dbdde6f21be5b1724f989d3.png",
            description: "fearful"
       },
       {
            id: 4,
            url:"http://emojipedia-us.s3.amazonaws.com/cache/ce/1a/ce1a33d6a4535ce73c8b2b899d51071b.png",
            description: "neutral"
       }
    ];

    return {init: init};
    

    function init() {
        getPositions().then((data) => {
            updatePositions(data);
            initialRender();
            attachEventHandlers();
            initUpdateLoop();
        });
    }

    function getPositions() {
        return $.get('/get-positions');
    }

    function initialRender() {
        positions.forEach(addImage);
    }
    
    function addImage(item) {
        var emoji = $('<img>')
            .attr({
                'id': item.id,
                'src': item.url,
                'title': item.description,
                'draggable': false
            })
            .css({
                top: item.top,
                left: item.left
            });
        $container.append(emoji);
    }

    function attachEventHandlers() {
        $('img').on('mousedown', onMouseDown);
        $('body').on('mouseup', onMouseUp);
        $('body').on('mousemove', onMouseMove);
    }

    function onMouseDown(e) {
        var offset = $(event.target).offset();
        draggedId = Number($(e.target).attr('id'));
        dragOffset.top = offset.top - e.pageY;
        dragOffset.left = offset.left - e.pageX;
    }

    function onMouseUp() {
        if (draggedId !== null) {
            draggedId = null;
        }
    }

    function onMouseMove(e) {
        var containerOffset = $('#container').offset();
        mouseCoordinates.y = e.pageY - containerOffset.top;
        mouseCoordinates.x = e.pageX - containerOffset.left;
    }

    function initUpdateLoop() {
        setInterval(checkPositions, UPDATE_INTERVAL);
    }


    function checkPositions() {
        var loadPositions;

        if (draggedId !== null) {
            var newPosition = {
                id: draggedId,
                top: mouseCoordinates.y + dragOffset.top,
                left: mouseCoordinates.x + dragOffset.left
            };
            loadPositions = sendPosition(newPosition);
        } else {
            loadPositions = getPositions();
        }

        loadPositions
            .then(updatePositions)
            .then(renderPositions);
    }

    function sendPosition(position) {
        return $.get('/update-positions',{
            index: position.id,
            top: position.top,
            left: position.left
        });
    }

    function updatePositions(positionData) {
        positionData.forEach((v, i) => {
            positions[i].top = v.top;
            positions[i].left = v.left;
        });
    }

    function renderPositions() {
        positions.forEach((emoji) => {
            $('#' + emoji.id).css({
                top: emoji.top,
                left: emoji.left
            });
        });
    }

}());

$(document).ready(() => {
    movingEmojis.init();
});