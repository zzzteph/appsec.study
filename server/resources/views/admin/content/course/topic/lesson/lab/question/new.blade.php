@include('include.header')


	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
			<li><a href="#">Courses</a></li>
			<li><a href="{{route('topics',['id' => $course->id])}}">{{$course->name}}</a></li>
			<li><a href="{{route('lessons',['course_id' => $course->id,'topic_id' => $topic->id])}}">{{$topic->name}}</a></li>
			<li><a href="{{route('view-lesson',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id'=>$lesson->id])}}">{{$lesson->name}}</a></li>
		  </ul>
	</nav>
    </div>



	 <section class="section">
		 <div class="container">

		
			<form method="POST" action="{{route('create-lab-lesson-questions',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id' => $lesson->id])}}">
			@csrf



<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="question"></textarea>
	
  </div>
</div> 

	

<div class="field">
  <label class="label">Answer</label>
  <div class="control">
		<input class="input" type="text" placeholder="Answer" name="answer" value="">
  </div>
</div>


<div class="field">
  <label class="label">Score</label>
  <div class="control">
		<input class="input" type="text" placeholder="100" name="score" value="100">
  </div>
</div>





<div class="field">
  <div class="control">
    <button class="button is-success is-large">Save</button>
  </div>
</div>
</form>


    </div>

    </section>



@include('include.footer')