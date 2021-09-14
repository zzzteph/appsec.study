@include('include.header')

	<section class="section">
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
			<li class="is-active"><a href="#">Courses</a></li>

		  </ul>
	</nav>
	

		<p><a class="button is-success" href={{route('admin-new-course')}}>Add new course</a></p>


	
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
       <strong class="is-size-4"><a href="{{route('admin-list-topics',['course_id' => $course->id])}}">{{$course->name}}</a> </strong>

			@if ($course->published === 1)
				<a class="button is-small is-success" href="#">published</a>
			@else
				<a class="button is-small is-danger" href="#">draft</a>
			@endif
			<a class="button is-small is-warning" href={{route('admin-edit-course',['id' => $course->id])}}>Edit</a>
			

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

</span>
</p>
<p>
<span class="icon-text  is-size-5 is-align-items-center">
  <span class="icon is-large">
    <i class="fas fa-flask fa-lg"></i>
  </span>

</span>
</p><p>
<span class="icon-text is-size-5 is-align-items-center">
  <span class="icon is-large">
    <i class="fas fa-graduation-cap fa-lg"></i>
  </span>
  

</span>
</p>
  </div>
</article>
  
   
   
@endforeach



    </div>

    </section>
@include('include.footer')