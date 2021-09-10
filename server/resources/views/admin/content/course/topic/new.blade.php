@include('include.header')


	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
		  <li><a href="{{route('courses')}}">Courses</a></li>
			<li class="is-active"><a href="#">{{$course->name}}</a></li>

		  </ul>
	</nav>
    </div>



	 <section class="section">
		 <div class="container">

<form method="POST" action="{{route('add-new-topic',['course_id' => $course->id])}}">
  @csrf

	

<div class="field">
  <label class="label">Name</label>
  <div class="control">

		<input class="input" type="text" placeholder="Topic name" name="name" value="">
	
  </div>
</div>


<div class="field">
  <label class="label">Description</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="description"></textarea>
	
  </div>
</div>

<div class="field">
  <div class="control">
    <label class="checkbox">
		<input type="checkbox" name="published">
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