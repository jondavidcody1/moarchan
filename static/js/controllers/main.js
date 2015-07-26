rtgo.controllers.main = function main(view) {
    'use strict';

    var disclaimer_container = gg('.disclaimer-container'),
        defaultRoutes = ["/", "/news", "/blog", "/faq", "/rules", "/advertise", "/press", "/about", "/feedback", "/legal", "/contact"];

    function disclaimerCallback(e, path) {
        window.location.hash = path.replace(/\#/g, '').replace(/\/\//g, '');
        disclaimer_container.addClass('hide');
    }

    function defaultHandler(path) {
        return function (e) {
            if (path) {
                window.location.hash = path.replace(/\#/g, '').replace(/\/\//g, '');
            }
        };
    }

    function topicHandler(path) {
        return function (e) {
            if (path) {
                disclaimer_container.remClass('hide');
                gg('.close-disclaimer').once('click', disclaimer_container.addClass.bind(disclaimer_container, 'hide'), false);
                gg('#agree-to-disclaimer').once('click', disclaimerCallback, false, path);
            }
        };
    }

    rtgo.popup = function popup(path) {
        return defaultRoutes.indexOf(path) !== -1 ? defaultHandler(path) : topicHandler(path);
    };
};
