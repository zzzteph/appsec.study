@include('include.header')

	 <section class="section">
		 <div class="container">
<h1 class="title">{{$lesson->theory->header}}

</h1>
<div class="content">
{!! $lesson->theory->content !!}

</div>
		
</div>
    </section>
	
		 <section class="section">
		 <div class="container">


 
 <hr/>

	 
 <div class="columns is-mobile">



 <div class="column is-4">
<div class="field">
  <div class="control">
    <button class="button is-success">
	
	<span class="icon-text">
  <span class="icon">
    <i class="fas fa-thumbs-up"></i>
  </span>
  <span>Confirm</span>
</span>
		</button>
  </div>
	</div>
	 </div>
@if($lesson->theory->cancel==TRUE)

 <div class="column is-4 is-offset-6">
<div class="field is-grouped-right">
  <div class="control">
    <button class="button is-danger">
	
	<span class="icon-text">
  <span class="icon">
    <i class="fas fa-ban"></i>
  </span>
  <span>Cancel</span>
</span>

	
	</button>
  </div>
</div>
 </div>
@endif	
	</div>
	
</div>




			

    </section>

	
@include('include.footer')