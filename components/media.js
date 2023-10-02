export default function rangeSlider() {
    var sliders = document.querySelectorAll('.range-slider');
    sliders.forEach(function (slider) {
        var range = slider.querySelector('.range-slider__range');
        var value = slider.querySelector('.range-slider__value');
        var initialValue = range.getAttribute('value');
        value.innerHTML = initialValue;
        range.addEventListener('input', function () {
            value.innerHTML = this.value + '%';
        });
    });
}


