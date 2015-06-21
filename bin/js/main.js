/* Links */

$('a[href=#lets-chat]').on('click', function(event){
	event.preventDefault();

	var target = $('#lets-chat');

	$('html, body').animate({
		scrollTop: target.offset().top
	}, 1000);

	return false;
});
$('a[href=#about]').on('click', function(event){
	event.preventDefault();

	var target = $('#about');

	$('html, body').animate({
		scrollTop: target.offset().top
	}, 1000);

	return false;
});
$('a[href=#moneyz]').on('click', function(event){
	event.preventDefault();

	var target = $('#moneyz');

	$('html, body').animate({
		scrollTop: target.offset().top
	}, 1000);

	return false;
});
$('a[href=#embed]').on('click', function(event){
	event.preventDefault();

	var target = $('#embed');

	$('html, body').animate({
		scrollTop: target.offset().top
	}, 1000);

	return false;
});
$('a[href=#header]').on('click', function(event){
	event.preventDefault();

	var target = $('#header');

	$('html, body').animate({
		scrollTop: target.offset().top
	}, 1000);

	return false;
});
$('a[href=#down-to-business]').on('click', function(event){
	event.preventDefault();

	var target = $('#down-to-business');

	$('html, body').animate({
		scrollTop: target.offset().top
	}, 350);

	return false;
});




$(document).on('ready', function(event){

	/* Header */
	var window_height = $(window).height();
	window_height = parseInt(window_height, 10);
	$("#header").css('height', window_height+"px");

	/* Navbar */
	var navbar        = $("#nav");
	var header_top    = $("#header").offset().top;
	var header_height = $("#header").outerHeight();
	var header_bottom = header_top + header_height;

	$(window).on('scroll', function(event){

		var window_top = $(window).scrollTop();

		if(window_top > header_bottom){
			$(navbar).addClass('scrolled-past');
		}else{
			$(navbar).removeClass('scrolled-past');
		}

	});

});
