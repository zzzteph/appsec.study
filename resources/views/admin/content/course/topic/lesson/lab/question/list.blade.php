@include('include.header')
    <section class="section">
	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
			<li><a href="#">Courses</a></li>
			<li><a href="{{route('topics',['id' => $course->id])}}">{{$course->name}}</a></li>
			<li><a href="{{route('lessons',['course_id' => $course->id,'topic_id' => $topic->id])}}">{{$topic->name}}</a></li>
			<li><a href="{{route('view-lesson',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id'=>$lesson->id])}}">{{$lesson->name}}</a></li>
		  </ul>
	</nav>
	
	
	<h1 class="title"> {{$lesson->name}} </h1>
			<p><a class="button is-success" href="{{route('new-lab-lesson-questions',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id'=>$lesson->id])}}">Add question</a></p>

<hr/>
    </div>

		 <div class="container">





@foreach ($lesson->lab->questions as $question)
   
 
<article class="media box ">
  <figure class="media-left">


  <span class="icon-text is-align-items-center">
  <span class="icon is-large">
  @if($question->type=="string")
    <i class="fas fa-question fa-lg"></i>
	@else
	 <i class="fas fa-meh-blank fa-lg"></i>
	@endif

  </span>
</span>

  <p><a class="button is-small is-warning" href={{route('edit-lab-lesson-questions',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id'=>$lesson->id,'question_id'=>$question->id])}}>Edit</a></p>
	
  </figure>
  <div class="media-content ">
    <div class="content">
	
      <p>
					


{!! $question->question !!}
      </p>
	  <p>
	  Answer:<strong>{{$question->answer}}</strong>
	  
	  </p>
	  <p>
	  
	  <form method="POST" action="{{route('delete-lab-lesson-questions',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id'=>$lesson->id,'question_id'=>$question->id])}}">@method('DELETE')@csrf<button class="button is-small is-danger">delete</button></form>
	  
	  </p>
    </div>

  </div>
  
   <figure class="media-right">
       <form method="POST" action="{{route('inc-order-lab-lesson-questions',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id'=>$lesson->id,'question_id'=>$question->id])}}">@method('PUT')@csrf<button class="button is-small is-success">+</button></form>
  <strong>{{$question->order}}</strong>
			  			<form method="POST" action="{{route('dec-order-lab-lesson-questions',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id'=>$lesson->id,'question_id'=>$question->id])}}">@method('PUT')@csrf<button class="button is-small is-danger">-</button></form>

  
  </figure>
  
</article>
   
   
@endforeach




    </div>

    </section>
@include('include.footer')