@include('include.header')
    <section class="section">
	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">

	</nav>
	

		<p><a class="button is-success" href="{{route('admin-new-topic')}}">Add new topic</a></p>

<hr/>
    </div>

		 <div class="container">





@foreach ($topics as $topic)

 

<article class="media box">
     <figure class="media-left">

   <form method="POST" action="{{route('admin-update-topic-order-increase',['topic_id' => $topic->id])}}">@method('PUT')@csrf<button class="button is-small is-success">+</button></form>
				{{$topic->order}}
			<form method="POST" action="{{route('admin-update-topic-order-decrease',['topic_id' => $topic->id])}}">@method('PUT')@csrf<button class="button is-small is-danger">-</button></form>
  </figure>
   
   
  <div class="media-content">
    <div class="content">
      <p>
       <strong class="is-size-4"><a href="{{route('admin-nodes',['topic_id' => $topic->id])}}">{{$topic->name}}</a> </strong>

			@if ($topic->published === 1)
				<a class="button is-small is-success" href="#">published</a>
			@else
				<a class="button is-small is-danger" href="#">draft</a>
			@endif
			<a class="button is-small is-warning" href={{route('admin-edit-topic',['topic_id' => $topic->id])}}>Edit</a>

        <br>
        {{$topic->description}}
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