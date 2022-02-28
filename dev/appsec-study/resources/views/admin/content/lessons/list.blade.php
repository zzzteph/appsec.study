@include('include.header')
    <section class="section">
	
	 <div class="container">
		<p><a class="button is-success" href="{{route('admin-new-theory-lesson')}}">Add new theory lesson</a></p>
		<br/>
		<p><a class="button is-success" href="{{route('admin-new-lab-lesson')}}">Add new lab lesson</a></p>

<hr/>
    </div>

		 <div class="container">




@foreach ($lessons as $lesson)
   
	<article class="media box">
  <figure class="media-left">
  
  <span class="icon-text is-align-items-center">
  <span class="icon is-large">
  @if($lesson->type=="theory")
    <i class="fas fa-book-open fa-lg"></i>
	@else
	 <i class="fas fa-flask fa-lg"></i>
	@endif
  </span>
</span>
  
  
  </figure>
  <div class="media-content ">
    <div class="content">
      <p>
        <strong class="is-size-4">

			<a href="{{route('admin-view-lesson',['id'=>$lesson->id])}}">{{$lesson->name}}</a>
		
		</strong>

			@if ($lesson->published === 1)
						<a class="button is-small is-success" href="#">published</a>
					@else
						<a class="button is-small is-danger" href="#">draft</a>
					@endif
					
				
				  @if($lesson->type=="theory")
					<a class="button is-small is-warning" href={{route('admin-edit-theory-lesson',['id'=>$lesson->id])}}>Edit</a>
					@endif
				  @if($lesson->type=="lab")
					<a class="button is-small is-warning" href={{route('admin-edit-lab-lesson',['id'=>$lesson->id])}}>Edit</a>
					<a class="button is-small is-warning" href={{route('admin-list-lab-lesson-questions',['id'=>$lesson->id])}}>Questions</a>
					@endif
        <br>
{!! $lesson->description !!}
      </p>
<p>

	<form method="POST" action="{{route('admin-delete-lesson',['id'=>$lesson->id])}}">@method('DELETE')@csrf<button class="button is-small is-danger">delete</button></form>

</p>
	  
    </div>
	
	
	

  </div>
</article>
   
   
@endforeach



{{$lessons->onEachSide(5)->links()}}

    </div>

    </section>
@include('include.footer')