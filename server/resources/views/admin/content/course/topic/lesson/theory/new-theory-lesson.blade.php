@include('include.header')


	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
			<li><a href="#">Courses</a></li>
			<li><a href="{{route('topics',['id' => $course->id])}}">{{$course->name}}</a></li>
			<li><a href="{{route('lessons',['course_id' => $course->id,'topic_id' => $topic->id])}}">{{$topic->name}}</a></li>
		  </ul>
	</nav>
    </div>



	 <section class="section">
		 <div class="container">

			<form method="POST" action="{{route('add-new-theory-lesson',['course_id' => $course->id,'topic_id' => $topic->id])}}">
			@csrf

	
	<div class="field">
  <label class="label">Lesson name</label>
  <div class="control">
		<input class="input" type="text" placeholder="Lesson name" name="name" value="">
  </div>
</div>


<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="description"></textarea>
	
  </div>
</div>

<hr/>
	
	
	

<div class="field">
  <label class="label">Header</label>
  <div class="control">
		<input class="input" type="text" placeholder="Theory header" name="header" value="">
  </div>
</div>


<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="content"></textarea>
	
  </div>
</div>


<div class="field">
  <label class="label">Scope</label>
  <div class="control">
		<input class="input" type="text" placeholder="100" name="score" value="100">
  </div>
</div>



<div class="field">
  <div class="control">
    <label class="checkbox">
	
	@if (isset($lesson->published))
		@if ($lesson->published)
			<input type="checkbox" name="published" checked>
		@else
			<input type="checkbox" name="published">
		@endif
	@else
		<input type="checkbox" name="published">
	@endif
     Published
    </label>
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