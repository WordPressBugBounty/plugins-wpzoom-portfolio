(function () {
    const { subscribe, select } = wp.data;

    let timeout = null;

    function applyMasonry() {
        let containers = document.getElementsByClassName('wpzoom-blocks_portfolio-block');

        [].forEach.call(containers, function (el) {
            if (el.classList.contains('layout-masonry')) {
                var elem = el.querySelector('.wpzoom-blocks_portfolio-block_items-list');
                if (!elem) return;

                var msnry = new Masonry(elem, {
                    itemSelector: '.wpzoom-blocks_portfolio-block_item',
                });

                imagesLoaded(el).on('progress', function () {
                    msnry.layout();
                });
            }
        });
    }

    // Run Masonry initially
    applyMasonry();

    subscribe(() => {

        // Wait 500ms before reapplying Masonry (adjust delay as needed)
        timeout = setTimeout(() => {
            applyMasonry();
        }, 1);
    });
})();
