@include('include.header')

	 <section class="section">
		 <div class="container">
<h1 class="title">{{$lesson->theory->header}}
 @if($lesson->status=='done')
  <span class="icon has-text-success">
    <i class="fas fa-check"></i>
  </span>
@endif
</h1>
<div class="content">
{!! $lesson->theory->content !!}

</div>
		</div>

    </section>
	
		 <section class="section">
		 <div class="container">


 
 <hr/>

	 
 

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

    </section>

	
@include('include.footer')