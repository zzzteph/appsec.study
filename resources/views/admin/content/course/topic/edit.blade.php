@include('include.header')


	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
		    <li><a href="{{route('courses')}}">Courses</a></li>
			<li><a href="#">{{$course->name}}</a></li>
			<li class="is-active"><a href="{{route('lessons',['course_id' => $course->id,'topic_id' => $topic->id])}}">{{$topic->name}}</a></li>
		  </ul>
	</nav>
	
	
	
    </div>



	 <section class="section">
		 <div class="container">

<form method="POST" action="{{route('update-topic',['course_id' => $course->id,'topic_id' => $topic->id])}}">
  @method('PUT')
  @csrf

	

<div class="field">
  <label class="label">Name</label>
  <div class="control">
		<input class="input" type="text" name="name" value="{{$topic->name}}">
  </div>
</div>


<div class="field">
  <label class="label">Description</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="description">{{$topic->description}}</textarea>
	
  </div>
</div>

<div class="field">
  <div class="control">
    <label class="checkbox">
	

		@if ($topic->published)
			<input type="checkbox" name="published" checked>
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

		 <section class="section">
		 <div class="container">
<article class="message is-danger">
  <div class="message-header">
    <p>Danger!</p>

  </div>
  <div class="message-body">
			<form method="POST" action="{{route('delete-topic',['course_id' => $course->id,'topic_id' => $topic->id])}}">
			@csrf
			 @method('DELETE')
			<button class="button is-danger is-fullwidth">Delete topic</button>
			 </form>
  </div>
</article>

    </div>

    </section>


@include('include.footer')