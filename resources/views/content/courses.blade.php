@include('include.header')

	<section class="section">
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
			<li class="is-active"><a href="#">Courses</a></li>

		  </ul>
	</nav>
	
	
		@if(Auth::user()->admin)
		<p><a class="button is-success" href={{route('new-course')}}>Add new course</a></p>

	@endif
	
	<hr/>
    </div>

	

<div class="container">




@foreach ($courses as $course)
   
 
   <article class="media box">
  <figure class="media-left is-hidden-mobile">
    <p class="image is-128x128">
      <img src="{{$course->image}}">
    </p>
  </figure>
  <div class="media-content">
    <div class="content">
      <p>
       <strong class="is-size-4"><a href="{{route('topics',['id' => $course->id])}}">{{$course->name}}</a> </strong>
		@if(Auth::user()->admin)
			@if ($course->published === 1)
				<a class="button is-small is-success" href="#">published</a>
			@else
				<a class="button is-small is-danger" href="#">draft</a>
			@endif
			<a class="button is-small is-warning" href={{route('edit-course',['course_id' => $course->id])}}>Edit</a>
			
@endif
        <br>
        {{$course->description}}
      </p>
    </div>
	
	
	

  </div>
  <div class="media-right is-hidden-mobile">

<p>
<span class="icon-text  is-size-5  is-align-items-center">
  <span class="icon is-large">
    <i class="fas fa-tasks fa-lg"></i>
  </span>
  <span>{{$course->theory_lesson_done_count}}/{{$course->theory_lesson_count}}</span>
</span>
</p>
<p>
<span class="icon-text  is-size-5 is-align-items-center">
  <span class="icon is-large">
    <i class="fas fa-flask fa-lg"></i>
  </span>
  <span>{{$course->lab_lesson_done_count}}/{{$course->lab_lesson_count}}</span>
</span>
</p><p>
<span class="icon-text is-size-5 is-align-items-center">
  <span class="icon is-large">
    <i class="fas fa-graduation-cap fa-lg"></i>
  </span>
  
  <span>{{$course->topics_done_count}}/{{$course->topics_count}}</span>
</span>
</p>
  </div>
</article>
  
   
   
@endforeach















    </div>

    </section>
@include('include.footer')