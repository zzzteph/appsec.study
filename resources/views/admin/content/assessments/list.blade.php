@include('include.header')
    <section class="section">
	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">

	</nav>
	

		<p><a class="button is-success" href="{{route('admin-new-assessment')}}">Add new Assessment</a></p>

<hr/>
    </div>

		 <div class="container">





@foreach ($assessments as $assessment)

 

<article class="media box">

   
  <div class="media-content">
    <div class="content">
      <p>
       <strong class="is-size-4"><a href="{{route('admin-nodes',['topic_id' =>$assessment->topic->id])}}">{{$assessment->name}}</a> </strong>

			<a class="button is-small is-warning" href={{route('admin-edit-tournament',['id' => $assessment->topic->id])}}>Edit</a>

      </p>
    </div>
	
	
	

  </div>
  <div class="media-right">



  </div>
</article>
  
   
   
@endforeach











    </div>

    </section>
@include('include.footer')