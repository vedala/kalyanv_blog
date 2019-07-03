---
---
$('#contact-form').submit(function(e){
    e.preventDefault();
    $.ajax({
        url:'{{ site.action_url }}',
        type:'post',
        data:$('#contact-form').serialize(),
        success:function(){
        window.location = "{{ site.url }}/{{ site.thank_you_page }}";
        }
    });
});
