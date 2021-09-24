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
	
	
	
<hr/>
    </div>

		 <div class="container">





@foreach ($topics as $topic)

 
  @if($topic->is_done)
<article class="media box has-background-success-light">
@else
<article class="media box">
@endif
 


   
   
  <div class="media-content">
    <div class="content">
      <p>
       <strong class="is-size-4"><a href="{{route('lessons',['course_id' => $course->id,'topic_id' => $topic->id])}}">{{$topic->name}}</a> </strong>
        <br>
        {{$topic->description}}
      </p>
    </div>
	
	
	

  </div>
  <div class="media-right">

@if($topic->theory_lesson_done_count!=0)
<p>
<span class="icon-text  is-size-5  is-align-items-center">
  <span class="icon is-large">
    <i class="fas fa-tasks fa-lg"></i>
  </span>
  <span>{{$topic->theory_lesson_done_count}}</span>
</span>
</p>
@endif
@if($topic->lab_lesson_done_count!=0)
<p>
<span class="icon-text  is-size-5 is-align-items-center">
  <span class="icon is-large">
    <i class="fas fa-flask fa-lg"></i>
  </span>
  <span>{{$topic->lab_lesson_done_count}}</span>
</span>
</p>
@endif
  </div>
</article>
  
   
   
@endforeach











    </div>

    </section>
@include('include.footer')