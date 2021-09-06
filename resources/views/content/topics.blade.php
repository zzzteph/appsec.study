@include('include.header')
    <section class="section">
	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
		  <li><a href="{{route('courses')}}">Courses</a></li>
			<li class="is-active"><a href="#">{{$course->name}}</a></li>
		  </ul>
	</nav>
	
	
	<h1 class="title"> {{$course->name}} </h1>
	
		@if(Auth::user()->admin)

		<p><a class="button is-success" href="{{route('new-topic',['id' => $course->id])}}">Add new topic</a></p>

	@endif
	
	
<hr/>
    </div>

		 <div class="container">





@foreach ($topics as $topic)

 
  @if($topic->is_done)
<article class="media box has-background-success-light">
@else
<article class="media box">
@endif
 

     <figure class="media-left">
	 @if(Auth::user()->admin)
   <form method="POST" action="{{route('update-topic-order-increase',['course_id' => $course->id,'topic_id' => $topic->id])}}">@method('PUT')@csrf<button class="button is-small is-success">+</button></form>
				{{$topic->order}}
			<form method="POST" action="{{route('update-topic-order-decrease',['course_id' => $course->id,'topic_id' => $topic->id])}}">@method('PUT')@csrf<button class="button is-small is-danger">-</button></form>
			@endif
  </figure>
   
   
  <div class="media-content">
    <div class="content">
      <p>
       <strong class="is-size-4"><a href="{{route('lessons',['course_id' => $course->id,'topic_id' => $topic->id])}}">{{$topic->name}}</a> </strong>
		@if(Auth::user()->admin)
			@if ($topic->published === 1)
				<a class="button is-small is-success" href="#">published</a>
			@else
				<a class="button is-small is-danger" href="#">draft</a>
			@endif
			<a class="button is-small is-warning" href={{route('edit-topic',['course_id' => $course->id,'topic_id' => $topic->id])}}>Edit</a>
			
			@endif
        <br>
        {{$topic->description}}
      </p>
    </div>
	
	
	

  </div>
  <div class="media-right">

<p>
<span class="icon-text  is-size-5  is-align-items-center">
  <span class="icon is-large">
    <i class="fas fa-tasks fa-lg"></i>
  </span>
  <span>{{$topic->theory_lesson_done_count}}/{{$topic->theory_lesson_count}}</span>
</span>
</p>
<p>
<span class="icon-text  is-size-5 is-align-items-center">
  <span class="icon is-large">
    <i class="fas fa-flask fa-lg"></i>
  </span>
  <span>{{$topic->lab_lesson_done_count}}/{{$topic->lab_lesson_count}}</span>
</span>
</p>
  </div>
</article>
  
   
   
@endforeach











    </div>

    </section>
@include('include.footer')