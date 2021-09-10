@include('include.header')
    <section class="section">
	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
			<li><a href="{{route('courses')}}">Courses</a></li>
			<li><a href="{{route('topics',['id' => $course->id])}}">{{$course->name}}</a></li>
			<li class="is-active"><a href="#" >{{$topic->name}}</a></li>
		  </ul>
	</nav>
	
	
	<h1 class="title"> {{$topic->name}} </h1>
	
	@if(Auth::user()->admin)

		<p><a class="button is-success" href="{{route('new-theory-lesson',['course_id' => $course->id,'topic_id' => $topic->id])}}">Add new theory lesson</a></p>
		<br/>
		<p><a class="button is-success" href="{{route('new-lab-lesson',['course_id' => $course->id,'topic_id' => $topic->id])}}">Add new lab lesson</a></p>
	@endif

<hr/>
    </div>

		 <div class="container">




@foreach ($lessons as $lesson)
   
 @if($lesson->is_done)
<article class="media box has-background-success-light">
@elseif(!$lesson->is_done && !$lesson->is_opened)
<article class="media box has-background-light">
@else
	<article class="media box">
@endif
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
		@if($lesson->is_done || $lesson->is_opened)
			<a href="{{route('view-lesson',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id'=>$lesson->id])}}">{{$lesson->name}}</a>
		@else
			{{$lesson->name}}
		@endif
		
		
		
		</strong>
				@if(Auth::user()->admin)
					@if ($lesson->published === 1)
						<a class="button is-small is-success" href="#">published</a>
					@else
						<a class="button is-small is-danger" href="#">draft</a>
					@endif
					
				
					  @if($lesson->type=="theory")
					<a class="button is-small is-warning" href={{route('edit-theory-lesson',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id'=>$lesson->id])}}>Edit</a>
					@endif
				  @if($lesson->type=="lab")
					<a class="button is-small is-warning" href={{route('edit-lab-lesson',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id'=>$lesson->id])}}>Edit</a>
				
					<a class="button is-small is-warning" href={{route('list-lab-lesson-questions',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id'=>$lesson->id])}}>Questions</a>
				
					@endif
				@endif
        <br>
{!! $lesson->description !!}
      </p>
<p>@if(Auth::user()->admin)
	  <form method="POST" action="{{route('delete-lesson',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id'=>$lesson->id])}}">@method('DELETE')@csrf<button class="button is-small is-danger">delete</button></form>
	@endif
</p>
	  
    </div>
	
	
	

  </div>
  <div class="media-right">

<p>
@if($lesson->status=='done')
<span class="icon-text is-size-5 is-align-items-center">
  <span class="icon is-large">
    <i class="fas fa-check fa-lg"></i>
  </span>
</span>
</p>
@endif
<p>

	 @if(Auth::user()->admin)
   <form method="POST" action="{{route('update-lesson-order-increase',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id' => $lesson->id])}}">@method('PUT')@csrf<button class="button is-small is-success">+</button></form>
				{{$lesson->order}}
			<form method="POST" action="{{route('update-lesson-order-decrease',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id' => $lesson->id])}}">@method('PUT')@csrf<button class="button is-small is-danger">-</button></form>
			@endif
</p>


  </div>
</article>
   
   
@endforeach





    </div>

    </section>
@include('include.footer')