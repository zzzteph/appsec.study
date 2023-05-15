@include('include.header')

	 <section class="section">
	 
	 	 <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
         <ul>
            <li><a href="{{route('admin-view-lessons')}}">Lesson management</a></li>
            <li class="is-active"><a href="#" >{{$lesson->name}}</a></li>
         </ul>
      </nav>
	  <hr/>
</div>
	 
		 <div class="container">
<h1 class="title">{{$lesson->theory->header}}</h1>


<div class="content">
{!! $lesson->theory->content !!}

</div>
		
</div>
    </section>
	
		 <section class="section">
		 <div class="container">


 
 <hr/>

	 
 <div class="columns is-mobile">


@if($lesson->theory->cancel==TRUE)
 <div class="column is-half">
@else
	 <div class="column is-full">
@endif
<div class="field">
  <div class="control">
    <button class="button is-success is-large is-fullwidth">
	
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

 <div class="column is-half">
<div class="field is-grouped-right">
  <div class="control">
    <button class="button is-danger is-large is-fullwidth">
	
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